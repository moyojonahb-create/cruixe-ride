package websocket

import (
	"context"
	"encoding/json"
	"sync"
	"testing"

	"github.com/gofiber/contrib/socketio"
)

// fakePubSub is a synchronous in-memory PubSub for tests: Publish invokes
// every handler registered for the channel immediately, in-process, so
// cross-instance delivery can be exercised without a real Redis.
type fakePubSub struct {
	mu         sync.Mutex
	handlers   map[string][]func([]byte)
	registered chan struct{}
}

type failingPubSub struct{}

func (failingPubSub) Publish(context.Context, string, []byte) error {
	return context.DeadlineExceeded
}

func (failingPubSub) Subscribe(ctx context.Context, channel string, handler func([]byte)) error {
	<-ctx.Done()
	return ctx.Err()
}

func newFakePubSub() *fakePubSub {
	return &fakePubSub{
		handlers:   make(map[string][]func([]byte)),
		registered: make(chan struct{}, 8),
	}
}

func (p *fakePubSub) Publish(ctx context.Context, channel string, payload []byte) error {
	p.mu.Lock()
	handlers := append([]func([]byte){}, p.handlers[channel]...)
	p.mu.Unlock()
	for _, h := range handlers {
		h(payload)
	}
	return nil
}

func (p *fakePubSub) Subscribe(ctx context.Context, channel string, handler func([]byte)) error {
	p.mu.Lock()
	p.handlers[channel] = append(p.handlers[channel], handler)
	p.mu.Unlock()
	p.registered <- struct{}{}
	<-ctx.Done()
	return ctx.Err()
}

// addFakeClient registers a connection directly in the Manager's local
// client table, bypassing AddClient's writeLoop (which needs a real network
// connection) — enough to exercise Send/SendToUser's channel handoff.
func addFakeClient(m *Manager) (*socketio.Websocket, *clientState) {
	conn := &socketio.Websocket{}
	state := &clientState{
		send:  make(chan []byte, 4),
		done:  make(chan struct{}),
		rooms: make(map[string]bool),
	}
	m.clientsMu.Lock()
	m.clients[conn] = state
	m.clientsMu.Unlock()
	return conn, state
}

type testNode struct {
	manager *Manager
	riders  *ConnectionRegistry
	drivers *ConnectionRegistry
}

// newTestNode builds a node with an explicit nodeID rather than relying on
// Manager's default time.Now().UnixNano()-derived one: two nodes created
// back-to-back in a test can otherwise collide at that resolution, which
// would make one instance wrongly self-filter the other's messages as its
// own (see handlePubSubMessage's NodeID check).
func newTestNode(bus *fakePubSub, nodeID string) *testNode {
	riders := NewConnectionRegistry()
	drivers := NewConnectionRegistry()
	m := NewManager().WithPubSub(bus).WithUserRegistries(riders, drivers)
	m.nodeID = nodeID
	return &testNode{manager: m, riders: riders, drivers: drivers}
}

// startAndWaitSubscribed starts pub/sub on each node and blocks until every
// node has finished registering its handler on the fake bus, so a
// subsequent Publish is guaranteed to reach all of them deterministically.
func startAndWaitSubscribed(ctx context.Context, bus *fakePubSub, nodes ...*testNode) {
	for _, n := range nodes {
		n.manager.StartPubSub(ctx)
	}
	for range nodes {
		<-bus.registered
	}
}

func TestSendToUserDeliversAcrossInstances(t *testing.T) {
	bus := newFakePubSub()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a := newTestNode(bus, "node-a")
	b := newTestNode(bus, "node-b")
	startAndWaitSubscribed(ctx, bus, a, b)

	// driver-1 is connected locally to node b only.
	conn, state := addFakeClient(b.manager)
	b.drivers.Set("driver-1", conn)

	payload := []byte(`{"event":"ride_offer"}`)
	delivered := a.manager.SendToUser(RoleDriver, "driver-1", payload)
	if delivered {
		t.Fatal("expected no local delivery on node a: driver is connected to node b")
	}

	select {
	case got := <-state.send:
		if string(got) != string(payload) {
			t.Fatalf("payload mismatch: got %s want %s", got, payload)
		}
	default:
		t.Fatal("expected node b to receive the message via the pub/sub fallback")
	}
}

func TestSendToUserLocalDeliveryDoesNotDoubleDeliverViaPubSub(t *testing.T) {
	bus := newFakePubSub()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a := newTestNode(bus, "node-a")
	startAndWaitSubscribed(ctx, bus, a)

	conn, state := addFakeClient(a.manager)
	a.riders.Set("rider-1", conn)

	delivered := a.manager.SendToUser(RoleRider, "rider-1", []byte(`{"event":"ping"}`))
	if !delivered {
		t.Fatal("expected local delivery to succeed")
	}

	select {
	case <-state.send:
	default:
		t.Fatal("expected the one local delivery")
	}
	select {
	case extra := <-state.send:
		t.Fatalf("expected no second, self-published delivery, got %s", extra)
	default:
	}
}

func TestSendToUserRoutesByRoleNotJustUserID(t *testing.T) {
	bus := newFakePubSub()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a := newTestNode(bus, "node-a")
	b := newTestNode(bus, "node-b")
	startAndWaitSubscribed(ctx, bus, a, b)

	// Same account, connected to node b as both a rider and a driver — a
	// real scenario since registerAsRider/registerAsDriver are independent.
	riderConn, riderState := addFakeClient(b.manager)
	b.riders.Set("dual-1", riderConn)
	driverConn, driverState := addFakeClient(b.manager)
	b.drivers.Set("dual-1", driverConn)

	a.manager.SendToUser(RoleDriver, "dual-1", []byte(`{"event":"ride_offer"}`))

	select {
	case <-driverState.send:
	default:
		t.Fatal("expected the driver connection to receive the driver-targeted message")
	}
	select {
	case got := <-riderState.send:
		t.Fatalf("expected the rider connection to receive nothing, got %s", got)
	default:
	}
}

func TestHandlePubSubMessageDropsSequenceReplays(t *testing.T) {
	bus := newFakePubSub()
	receiver := newTestNode(bus, "node-receiver")

	conn, state := addFakeClient(receiver.manager)
	receiver.drivers.Set("driver-1", conn)

	env := wsEnvelope{
		Kind:    envelopeKindUser,
		NodeID:  "node-a",
		Role:    RoleDriver,
		UserID:  "driver-1",
		Seq:     1,
		Payload: json.RawMessage(`{"n":1}`),
	}
	raw, err := json.Marshal(env)
	if err != nil {
		t.Fatalf("marshal envelope: %v", err)
	}

	receiver.manager.handlePubSubMessage(raw)
	select {
	case <-state.send:
	default:
		t.Fatal("expected the first delivery to succeed")
	}

	receiver.manager.handlePubSubMessage(raw) // exact replay, same sequence
	select {
	case got := <-state.send:
		t.Fatalf("expected the replayed sequence to be dropped, got %s", got)
	default:
	}

	env.Seq = 2
	raw2, err := json.Marshal(env)
	if err != nil {
		t.Fatalf("marshal envelope: %v", err)
	}
	receiver.manager.handlePubSubMessage(raw2)
	select {
	case <-state.send:
	default:
		t.Fatal("expected a newer sequence to still be delivered")
	}
}

func TestHandlePubSubMessageStillDeliversRoomBroadcastsAfterEnvelopeRefactor(t *testing.T) {
	bus := newFakePubSub()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	a := newTestNode(bus, "node-a")
	b := newTestNode(bus, "node-b")
	startAndWaitSubscribed(ctx, bus, a, b)

	conn, state := addFakeClient(b.manager)
	b.manager.JoinRoom("ride_123", conn)

	a.manager.BroadcastRoom("ride_123", []byte(`{"event":"ride_started"}`))

	select {
	case <-state.send:
	default:
		t.Fatal("expected the room broadcast to reach the client on the other instance")
	}
}

func TestRevokeRoomRemovesLocalConnectionAndBlocksFutureRoomEvents(t *testing.T) {
	m := NewManager()
	conn, state := addFakeClient(m)
	m.JoinRoom("ride_cancel", conn)

	m.RevokeRoom("ride_cancel")
	if got := len(m.RoomSnapshot("ride_cancel")); got != 0 {
		t.Fatalf("expected room to be empty after revocation, got %d clients", got)
	}
	select {
	case got := <-state.send:
		var event map[string]string
		if err := json.Unmarshal(got, &event); err != nil || event["event"] != "room_revoked" {
			t.Fatalf("expected room_revoked notification, got %s", got)
		}
	default:
		t.Fatal("expected local client to receive room_revoked notification")
	}

	m.BroadcastRoomLocal("ride_cancel", []byte(`{"event":"driver_location"}`))
	select {
	case got := <-state.send:
		t.Fatalf("revoked connection received a future room event: %s", got)
	default:
	}
}

func TestRevokeRoomPropagatesAcrossInstancesAndBlocksFutureEvents(t *testing.T) {
	bus := newFakePubSub()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	a := newTestNode(bus, "node-a")
	b := newTestNode(bus, "node-b")
	startAndWaitSubscribed(ctx, bus, a, b)
	conn, state := addFakeClient(b.manager)
	b.manager.JoinRoom("ride_complete", conn)

	a.manager.RevokeRoom("ride_complete")
	select {
	case got := <-state.send:
		var event map[string]string
		if err := json.Unmarshal(got, &event); err != nil || event["event"] != "room_revoked" {
			t.Fatalf("expected remote room_revoked notification, got %s", got)
		}
	default:
		t.Fatal("expected remote room revocation")
	}
	if got := len(b.manager.RoomSnapshot("ride_complete")); got != 0 {
		t.Fatalf("expected remote room to be empty after revocation, got %d clients", got)
	}

	a.manager.BroadcastRoom("ride_complete", []byte(`{"event":"driver_location"}`))
	select {
	case got := <-state.send:
		t.Fatalf("revoked remote connection received a future event: %s", got)
	default:
	}
}

func TestRevokeRoomPublishesFailureDoesNotUndoLocalRevocation(t *testing.T) {
	m := NewManager().WithPubSub(failingPubSub{})
	conn, state := addFakeClient(m)
	m.JoinRoom("ride_suspend", conn)

	m.RevokeRoom("ride_suspend")
	if got := len(m.RoomSnapshot("ride_suspend")); got != 0 {
		t.Fatalf("expected local revocation despite publish failure, got %d clients", got)
	}
	select {
	case <-state.send:
	default:
		t.Fatal("expected local revocation notification despite publish failure")
	}
}

func TestRevokeRoomSharesSequenceWithRoomBroadcasts(t *testing.T) {
	m := NewManager().WithPubSub(failingPubSub{})
	conn, state := addFakeClient(m)
	m.JoinRoom("ride_order", conn)
	m.BroadcastRoom("ride_order", []byte(`{"event":"location"}`))
	select {
	case <-state.send:
	default:
		t.Fatal("expected local room broadcast")
	}

	// A remote room message older than the revocation is rejected after the
	// revocation sequence has advanced the shared room stream.
	m.RevokeRoom("ride_order")
	select {
	case <-state.send:
	default:
		t.Fatal("expected local room revocation notification")
	}
	old := wsEnvelope{Kind: envelopeKindRoom, NodeID: "node-a", RoomID: "ride_order", Seq: 1, Payload: json.RawMessage(`{"event":"late"}`)}
	raw, err := json.Marshal(old)
	if err != nil {
		t.Fatalf("marshal old room envelope: %v", err)
	}
	m.handlePubSubMessage(raw)
	select {
	case got := <-state.send:
		t.Fatalf("late room event reached revoked connection: %s", got)
	default:
	}
}

func TestRevokeUserFromRoomTargetsOnlyTheRevokedParticipant(t *testing.T) {
	bus := newFakePubSub()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	a := newTestNode(bus, "node-a")
	b := newTestNode(bus, "node-b")
	startAndWaitSubscribed(ctx, bus, a, b)

	riderConn, riderState := addFakeClient(b.manager)
	b.riders.Set("rider-1", riderConn)
	driverConn, driverState := addFakeClient(b.manager)
	b.drivers.Set("driver-1", driverConn)
	b.manager.JoinRoom("ride_reassign", riderConn)
	b.manager.JoinRoom("ride_reassign", driverConn)

	a.manager.RevokeUserFromRoom("ride_reassign", RoleDriver, "driver-1")
	select {
	case got := <-driverState.send:
		var event map[string]string
		if err := json.Unmarshal(got, &event); err != nil || event["event"] != "room_user_revoked" {
			t.Fatalf("expected targeted revocation, got %s", got)
		}
	default:
		t.Fatal("expected revoked driver to receive targeted revocation")
	}
	if got := len(b.manager.RoomSnapshot("ride_reassign")); got != 1 || !b.manager.RoomSnapshot("ride_reassign")[riderConn] {
		t.Fatalf("expected only rider to remain in room, got %d clients", got)
	}

	a.manager.BroadcastRoom("ride_reassign", []byte(`{"event":"location"}`))
	select {
	case got := <-riderState.send:
		if string(got) != `{"event":"location"}` {
			t.Fatalf("unexpected rider payload: %s", got)
		}
	default:
		t.Fatal("expected remaining rider to receive room event")
	}
	select {
	case got := <-driverState.send:
		t.Fatalf("revoked driver received future room event: %s", got)
	default:
	}
}
