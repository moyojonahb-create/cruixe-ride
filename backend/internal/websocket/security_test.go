package websocket

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/gofiber/contrib/socketio"
	"github.com/jackc/pgx/v5"
	"strings"
	"testing"
	"time"
)

const driverSubject = "11111111-1111-4111-8111-111111111111"

type participantRow struct {
	rider, driver, status string
	err                   error
}

func (r participantRow) Scan(dst ...any) error {
	if r.err != nil {
		return r.err
	}
	*dst[0].(*string) = r.rider
	*dst[1].(*string) = r.driver
	*dst[2].(*string) = r.status
	return nil
}

type participantDB struct {
	row participantRow
	sql string
}

func (d *participantDB) QueryRow(_ context.Context, sql string, _ ...any) pgx.Row {
	d.sql = sql
	return d.row
}
func TestCanonicalRoomAndLocationPolicy(t *testing.T) {
	db := &participantDB{}
	eligibility := &fakeDriverAuthorizer{allowed: true}
	a := NewPostgresRoomAuthorizer(db, eligibility)
	for _, status := range []string{"pending", "scheduled", "accepted", "arrived", "in_progress", "completed", "cancelled", "expired", "unknown"} {
		for _, user := range []string{"rider-auth", driverSubject, "driver-row", "outsider"} {
			t.Run(status+"/"+user, func(t *testing.T) {
				db.row = participantRow{rider: "rider-auth", driver: driverSubject, status: status}
				allowed, err := a.CanJoinRideRoom(context.Background(), "ride", user)
				want := (activeRequest(status) && user == "rider-auth") || (activeTrip(status) && user == driverSubject)
				if err != nil || allowed != want {
					t.Fatalf("allowed=%v want=%v err=%v", allowed, want, err)
				}
				if !strings.Contains(db.sql, "r.user_id::text") || !strings.Contains(db.sql, "d.id=r.driver_id") {
					t.Fatal("canonical FK mapping lost")
				}
				location, err := a.CanReceiveRideLocation(context.Background(), "ride", user, driverSubject)
				if err != nil || location != (activeTrip(status) && (user == "rider-auth" || user == driverSubject)) {
					t.Fatal("location participant/state mismatch")
				}
			})
		}
	}
	db.row = participantRow{rider: "rider-auth", driver: driverSubject, status: "accepted"}
	eligibility.allowed = false
	if ok, _ := a.CanJoinRideRoom(context.Background(), "ride", driverSubject); ok {
		t.Fatal("suspended driver joined")
	}
	if ok, _ := a.CanReceiveRideLocation(context.Background(), "ride", "rider-auth", driverSubject); ok {
		t.Fatal("suspended driver location delivered")
	}
	eligibility.allowed = true
	if ok, _ := a.CanReceiveRideLocation(context.Background(), "ride", "rider-auth", "previous-driver"); ok {
		t.Fatal("old driver location delivered")
	}
	db.row.err = pgx.ErrNoRows
	if ok, err := a.CanJoinRideRoom(context.Background(), "missing", "rider-auth"); ok || err != nil {
		t.Fatal("unknown ride exposed")
	}
	db.row.err = errors.New("db unavailable")
	if ok, err := a.CanJoinRideRoom(context.Background(), "ride", "rider-auth"); ok || err == nil {
		t.Fatal("DB failure granted access")
	}
}
func secureClient(t *testing.T, a RoomAuthorizer, id AuthenticatedConnection) (*Manager, *socketio.Websocket, *clientState) {
	t.Helper()
	m := NewManager().WithUserRegistries(NewConnectionRegistry(), NewConnectionRegistry()).WithAuthorization(a, &fakeDriverAuthorizer{allowed: true})
	conn, s := addFakeClient(m)
	s.identity = &id
	if id.RegisterAsDriver {
		m.drivers.Set(id.UserID, conn)
	} else {
		m.riders.Set(id.UserID, conn)
	}
	return m, conn, s
}
func TestDeliveryRevalidatesAssignmentAndTerminalException(t *testing.T) {
	db := &participantDB{row: participantRow{rider: "rider-auth", driver: driverSubject, status: "accepted"}}
	a := NewPostgresRoomAuthorizer(db, &fakeDriverAuthorizer{allowed: true})
	m, conn, s := secureClient(t, a, AuthenticatedConnection{UserID: "rider-auth", ExpiresAt: time.Now().Add(time.Hour), RegisterAsRider: true})
	if !m.JoinAuthorizedRoom(conn, "ride_trip") {
		t.Fatal("join failed")
	}
	payload := []byte(`{"event":"driver_location","ride_id":"trip","room":"ride_trip","driver_id":"` + driverSubject + `"}`)
	if !m.Send(conn, payload) {
		t.Fatal("authorized location rejected")
	}
	queued := <-s.send
	db.row.driver = "22222222-2222-4222-8222-222222222222"
	if m.deliveryAllowed(conn, queued) {
		t.Fatal("queued previous assignment survived recheck")
	}
	db.row.status = "completed"
	if m.JoinAuthorizedRoom(conn, "ride_trip") {
		t.Fatal("terminal room joined")
	}
	final := []byte(`{"event":"ride_completed","ride_id":"trip","room":"ride_trip"}`)
	if !m.deliveryAllowed(conn, final) {
		t.Fatal("owner final lifecycle suppressed")
	}
	m.RevokeRoom("ride_trip")
	if m.deliveryAllowed(conn, payload) || m.JoinAuthorizedRoom(conn, "ride_trip") {
		t.Fatal("revocation restored access")
	}
}

type joinHook struct {
	fn      func()
	allowed bool
}

func (a *joinHook) CanJoinRideRoom(context.Context, string, string) (bool, error) {
	if a.fn != nil {
		a.fn()
	}
	return a.allowed, nil
}
func TestJoinIsFencedByConcurrentRevocation(t *testing.T) {
	a := &joinHook{allowed: true}
	m, conn, _ := secureClient(t, a, AuthenticatedConnection{UserID: "rider", ExpiresAt: time.Now().Add(time.Hour), RegisterAsRider: true})
	a.fn = func() { m.RevokeRoom("ride_trip") }
	if m.JoinAuthorizedRoom(conn, "ride_trip") {
		t.Fatal("inflight join outlived revocation")
	}
}
func TestOutOfOrderRevocationStillRemovesMembership(t *testing.T) {
	m := NewManager()
	conn, _ := addFakeClient(m)
	m.JoinRoom("ride_trip", conn)
	m.acceptSequence("remote", "room:ride_trip", 20)
	raw, _ := json.Marshal(wsEnvelope{Kind: envelopeKindRoomRevoke, NodeID: "remote", RoomID: "ride_trip", Seq: 10, Payload: json.RawMessage(`{"event":"room_revoked"}`)})
	m.handlePubSubMessage(raw)
	if m.RoomSnapshot("ride_trip")[conn] {
		t.Fatal("older revocation ignored after newer broadcast")
	}
}
func TestExpiryClosesIdleConnectionAndBlocksData(t *testing.T) {
	id := AuthenticatedConnection{UserID: "rider", ExpiresAt: time.Now().Add(30 * time.Millisecond), RegisterAsRider: true}
	m, conn, s := secureClient(t, &fakeRoomAuthorizer{allowed: true}, id)
	go m.watchAuthorization(conn, s, id)
	select {
	case <-s.done:
	case <-time.After(time.Second):
		t.Fatal("expired idle connection remains open")
	}
	if m.Send(conn, []byte(`{"event":"pong"}`)) {
		t.Fatal("expired connection received data")
	}
}
func TestSuspensionAndReassignmentRevokeExistingConnection(t *testing.T) {
	a := &fakeRoomAuthorizer{allowed: true}
	id := AuthenticatedConnection{UserID: driverSubject, ExpiresAt: time.Now().Add(time.Hour), RegisterAsDriver: true}
	m, conn, s := secureClient(t, a, id)
	if !m.JoinAuthorizedRoom(conn, "ride_trip") {
		t.Fatal("join failed")
	}
	a.allowed = false
	m.revalidateClient(conn, s)
	if m.RoomSnapshot("ride_trip")[conn] || !s.revokedRoom("ride_trip") {
		t.Fatal("reassigned room retained")
	}
	m.driverAuthorizer = &fakeDriverAuthorizer{allowed: false}
	m.revalidateClient(conn, s)
	if m.ClientCount() != 0 {
		t.Fatal("suspended driver connection retained")
	}
}

func TestSecureRevocationPropagatesAcrossManagers(t *testing.T) {
	bus := newFakePubSub()
	a := newTestNode(bus, "secure-a")
	b := newTestNode(bus, "secure-b")
	db := &participantDB{row: participantRow{rider: "rider-auth", driver: driverSubject, status: "accepted"}}
	authorizer := NewPostgresRoomAuthorizer(db, &fakeDriverAuthorizer{allowed: true})
	a.manager.WithAuthorization(authorizer, nil)
	b.manager.WithAuthorization(authorizer, nil)
	conn, state := addFakeClient(b.manager)
	state.identity = &AuthenticatedConnection{UserID: "rider-auth", ExpiresAt: time.Now().Add(time.Hour), RegisterAsRider: true}
	b.riders.Set("rider-auth", conn)
	if !b.manager.JoinAuthorizedRoom(conn, "ride_trip") {
		t.Fatal("initial join failed")
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	startAndWaitSubscribed(ctx, bus, a, b)
	db.row.status = "cancelled"
	a.manager.RevokeRoom("ride_trip")
	if b.manager.RoomSnapshot("ride_trip")[conn] || !state.revokedRoom("ride_trip") {
		t.Fatal("remote authorization retained")
	}
	select {
	case <-state.send:
	default:
		t.Fatal("remote revocation notification missing")
	}
	late := []byte(`{"event":"driver_location","ride_id":"trip","room":"ride_trip","driver_id":"` + driverSubject + `"}`)
	a.manager.BroadcastRoom("ride_trip", late)
	select {
	case <-state.send:
		t.Fatal("revoked client received late location")
	default:
	}
}
