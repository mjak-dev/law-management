package models

import "time"

type Client struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	Company   string    `json:"company"`
	CreatedAt time.Time `json:"created_at"`
}

type Case struct {
	ID           int64     `json:"id"`
	Title        string    `json:"title"`
	ClientID     int64     `json:"client_id"`
	ClientName   string    `json:"client_name,omitempty"` // populated during joins
	CaseNumber   string    `json:"case_number"`
	PracticeArea string    `json:"practice_area"`
	Status       string    `json:"status"` // Open, Pending, Closed
	Description  string    `json:"description"`
	Court        string    `json:"court"`
	DateOpened   time.Time `json:"date_opened"`
	CreatedAt    time.Time `json:"created_at"`
}

type Task struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	CaseID    int64     `json:"case_id"`
	CaseTitle string    `json:"case_title,omitempty"` // populated during joins
	DueDate   time.Time `json:"due_date"`
	Status    string    `json:"status"` // Pending, Completed
	Priority  string    `json:"priority"` // Low, Medium, High
	CreatedAt time.Time `json:"created_at"`
}

type Invoice struct {
	ID         int64     `json:"id"`
	CaseID     int64     `json:"case_id"`
	CaseTitle  string    `json:"case_title,omitempty"`
	ClientName string    `json:"client_name,omitempty"`
	Amount     float64   `json:"amount"`
	DueDate    time.Time `json:"due_date"`
	Status     string    `json:"status"` // Paid, Unpaid, Overdue
	IssuedDate time.Time `json:"issued_date"`
	Details    string    `json:"details"`
}

type DashboardStats struct {
	ActiveCases   int     `json:"active_cases"`
	PendingTasks  int     `json:"pending_tasks"`
	TotalClients  int     `json:"total_clients"`
	UnpaidInvoices float64 `json:"unpaid_invoices"`
}
