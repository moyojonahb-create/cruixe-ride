package websocket

import (
	"context"
	"encoding/json"
	"github.com/gofiber/contrib/socketio"
	"github.com/google/uuid"
	"strings"
	"time"
)

// SessionAuthorizer is optional until the deployed session model is verified.
// No guessed auth.sessions query or service-role bypass is introduced here.
type SessionAuthorizer interface {
	IsSessionActive(context.Context, string, string) (bool, error)
}
type RoomEventAuthorizer interface {
	CanReceiveRideLocation(context.Context, string, string, string) (bool, error)
	CanReceiveTerminalRideEvent(context.Context, string, string, string) (bool, error)
}

func (m *Manager) WithAuthorization(rooms RoomAuthorizer, drivers DriverAuthorizer) *Manager {
	m.authorizer = rooms
	m.driverAuthorizer = drivers
	m.authEnabled = true
	return m
}
func (m *Manager) WithSessionAuthorizer(sessions SessionAuthorizer) *Manager {
	m.sessionAuthorizer = sessions
	return m
}
func (m *Manager) stateFor(conn *socketio.Websocket) *clientState {
	m.clientsMu.Lock()
	defer m.clientsMu.Unlock()
	return m.clients[conn]
}
func (s *clientState) identityCopy() *AuthenticatedConnection {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.identity == nil {
		return nil
	}
	copy := *s.identity
	return &copy
}
func (s *clientState) revokedRoom(room string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.revoked[room]
}
func (s *clientState) revoke(room string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.revoked == nil {
		s.revoked = map[string]bool{}
	}
	s.revoked[room] = true
	delete(s.rooms, room)
}
func stateOpen(s *clientState) bool {
	if s == nil {
		return false
	}
	select {
	case <-s.done:
		return false
	default:
		return true
	}
}
func (m *Manager) validIdentity(ctx context.Context, id *AuthenticatedConnection) bool {
	if id == nil || id.UserID == "" || id.ExpiresAt.IsZero() || !time.Now().Before(id.ExpiresAt) {
		return false
	}
	if m.sessionAuthorizer != nil {
		if id.SessionID == "" {
			return false
		}
		ok, err := m.sessionAuthorizer.IsSessionActive(ctx, id.UserID, id.SessionID)
		if err != nil || !ok {
			return false
		}
	}
	if id.RegisterAsDriver {
		uid, err := uuid.Parse(id.UserID)
		if err != nil || m.driverAuthorizer == nil || m.driverAuthorizer.CanActAsDriver(ctx, uid) != nil {
			return false
		}
	}
	return true
}
func (m *Manager) AddAuthenticatedClient(conn *socketio.Websocket, id AuthenticatedConnection) {
	m.AddClient(conn)
	s := m.stateFor(conn)
	s.mu.Lock()
	s.identity = &id
	s.mu.Unlock()
	go m.watchAuthorization(conn, s, id)
}
func (m *Manager) watchAuthorization(conn *socketio.Websocket, s *clientState, id AuthenticatedConnection) {
	delay := time.Until(id.ExpiresAt)
	if delay <= 0 {
		m.RemoveClient(conn)
		return
	}
	expiry := time.AfterFunc(delay, func() { m.RemoveClient(conn) })
	defer expiry.Stop()
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-s.done:
			return
		case <-ticker.C:
			m.revalidateClient(conn, s)
		}
	}
}
func (m *Manager) revalidateClient(conn *socketio.Websocket, s *clientState) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	id := s.identityCopy()
	if !m.validIdentity(ctx, id) {
		m.RemoveClient(conn)
		return
	}
	for _, room := range s.Rooms() {
		if room == DriverRoleRoom {
			continue
		}
		ride, ok := RideIDFromRoom(room)
		allowed := false
		if ok && m.authorizer != nil {
			allowed, _ = m.authorizer.CanJoinRideRoom(ctx, ride, id.UserID)
		}
		if !allowed {
			role := RoleRider
			if id.RegisterAsDriver {
				role = RoleDriver
			}
			m.RevokeUserFromRoom(room, role, id.UserID)
		}
	}
}

// Joins are fenced against any concurrent revocation. A revoked room cannot be
// rejoined on this connection; a new connection must check current DB authority.
func (m *Manager) JoinAuthorizedRoom(conn *socketio.Websocket, room string) bool {
	s := m.stateFor(conn)
	if !stateOpen(s) || s.revokedRoom(room) {
		return false
	}
	id := s.identityCopy()
	ride, ok := RideIDFromRoom(room)
	if !ok || m.authorizer == nil {
		return false
	}
	m.roomsMu.Lock()
	epoch := m.authorizationEpoch
	m.roomsMu.Unlock()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if !m.validIdentity(ctx, id) {
		return false
	}
	allowed, err := m.authorizer.CanJoinRideRoom(ctx, ride, id.UserID)
	if err != nil || !allowed || !time.Now().Before(id.ExpiresAt) {
		return false
	}
	m.roomsMu.Lock()
	defer m.roomsMu.Unlock()
	if epoch != m.authorizationEpoch || !stateOpen(s) || s.revokedRoom(room) {
		return false
	}
	if m.rooms[room] == nil {
		m.rooms[room] = map[*socketio.Websocket]bool{}
	}
	m.rooms[room][conn] = true
	s.Join(room)
	return true
}
func (m *Manager) deliveryAllowed(conn *socketio.Websocket, payload []byte) bool {
	if !m.authEnabled {
		return true
	}
	s := m.stateFor(conn)
	if !stateOpen(s) {
		return false
	}
	id := s.identityCopy()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if !m.validIdentity(ctx, id) {
		m.RemoveClient(conn)
		return false
	}
	var event struct {
		Event    string `json:"event"`
		RideID   string `json:"ride_id"`
		Room     string `json:"room"`
		RoomID   string `json:"room_id"`
		DriverID string `json:"driver_id"`
	}
	if json.Unmarshal(payload, &event) != nil {
		return false
	}
	switch event.Event {
	case "ws_ready", "pong", "ack", "room_left", "join_room_denied", "room_revoked", "room_user_revoked":
		return stateOpen(s)
	case "room_joined":
		return !s.revokedRoom(event.RoomID) && m.RoomSnapshot(event.RoomID)[conn]
	case "ride_offer":
		return id.RegisterAsDriver && stateOpen(s) // dispatch request, not a driver's negotiated bid
	}
	ride := event.RideID
	if event.Room != "" {
		fromRoom, ok := RideIDFromRoom(event.Room)
		if !ok || (ride != "" && ride != fromRoom) {
			return false
		}
		ride = fromRoom
	}
	if ride == "" {
		return false
	}
	room := "ride_" + ride
	if event.Event == "ride_completed" || event.Event == "ride_cancelled" {
		checker, ok := m.authorizer.(RoomEventAuthorizer)
		if !ok {
			return false
		}
		allowed, err := checker.CanReceiveTerminalRideEvent(ctx, ride, id.UserID, event.Event)
		return err == nil && allowed && stateOpen(s) && time.Now().Before(id.ExpiresAt)
	}
	if s.revokedRoom(room) {
		return false
	}
	var allowed bool
	var err error
	if event.Event == "driver_location" {
		checker, ok := m.authorizer.(RoomEventAuthorizer)
		if !ok || !m.RoomSnapshot(room)[conn] {
			return false
		}
		allowed, err = checker.CanReceiveRideLocation(ctx, ride, id.UserID, event.DriverID)
	} else {
		switch event.Event {
		case "ride_accepted", "ride_started", "ride_status_updated":
		default:
			return false
		}
		if m.authorizer == nil {
			return false
		}
		allowed, err = m.authorizer.CanJoinRideRoom(ctx, ride, id.UserID)
	}
	return err == nil && allowed && stateOpen(s) && !s.revokedRoom(room) && time.Now().Before(id.ExpiresAt)
}
func validRoomName(room string) bool {
	return len(room) <= 160 && !strings.ContainsAny(room, " \t\r\n/")
}
