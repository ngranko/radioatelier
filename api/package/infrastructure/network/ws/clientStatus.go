package ws

type ClientStatus string

const (
	ClientStatusReady      ClientStatus = "ready"
	ClientStatusProcessing ClientStatus = "processing"
	ClientStatusClosed     ClientStatus = "closed"
)
