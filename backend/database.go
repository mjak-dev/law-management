package main

import (
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

func InitDB(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Create tables
	queries := []string{
		`CREATE TABLE IF NOT EXISTS clients (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			phone TEXT,
			company TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS cases (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			client_id INTEGER NOT NULL,
			case_number TEXT UNIQUE NOT NULL,
			practice_area TEXT NOT NULL,
			status TEXT DEFAULT 'Open',
			description TEXT,
			court TEXT,
			date_opened DATETIME DEFAULT CURRENT_TIMESTAMP,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS tasks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			case_id INTEGER NOT NULL,
			due_date DATETIME NOT NULL,
			status TEXT DEFAULT 'Pending',
			priority TEXT DEFAULT 'Medium',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS invoices (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			case_id INTEGER NOT NULL,
			amount REAL NOT NULL,
			due_date DATETIME NOT NULL,
			status TEXT DEFAULT 'Unpaid',
			issued_date DATETIME DEFAULT CURRENT_TIMESTAMP,
			details TEXT,
			FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
		);`,
	}

	for _, query := range queries {
		if _, err := db.Exec(query); err != nil {
			return nil, fmt.Errorf("failed to execute query %s: %w", query, err)
		}
	}

	return db, nil
}

func SeedDB(db *sql.DB) error {
	// Check if we already have clients
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM clients").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil // database already seeded
	}

	// Seed clients
	clients := []struct {
		name, email, phone, company string
	}{
		{"John Doe", "john.doe@example.com", "555-0199", "Acme Corporation"},
		{"Jane Smith", "jane.smith@example.com", "555-0144", "Initech LLC"},
		{"Harvey Specter", "harvey@specterlaw.com", "555-0188", "Pearson Darby"},
	}

	clientIDs := make([]int64, len(clients))
	for i, c := range clients {
		res, err := db.Exec("INSERT INTO clients (name, email, phone, company) VALUES (?, ?, ?, ?)",
			c.name, c.email, c.phone, c.company)
		if err != nil {
			return err
		}
		id, _ := res.LastInsertId()
		clientIDs[i] = id
	}

	// Seed cases
	cases := []struct {
		title         string
		clientID      int64
		caseNum       string
		practiceArea  string
		status        string
		description   string
		court         string
		dateOpened    time.Time
	}{
		{"Acme Corp vs Roadrunner Corp", clientIDs[0], "CASE-2026-001", "Corporate Litigation", "Open", "Breach of contract dispute over explosive delivery issues.", "US District Court - Eastern District", time.Now().AddDate(0, -2, 0)},
		{"Initech Tax Audit Appeal", clientIDs[1], "CASE-2026-002", "Tax Law", "Open", "Appeal of the IRS audit regarding automated rounding errors.", "US Tax Court", time.Now().AddDate(0, -1, 0)},
		{"IP Licensing Negotiations", clientIDs[2], "CASE-2026-003", "Intellectual Property", "Pending", "Drafting and negotiating cross-licensing agreements.", "Out of Court", time.Now().AddDate(0, 0, -10)},
	}

	caseIDs := make([]int64, len(cases))
	for i, c := range cases {
		res, err := db.Exec("INSERT INTO cases (title, client_id, case_number, practice_area, status, description, court, date_opened) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			c.title, c.clientID, c.caseNum, c.practiceArea, c.status, c.description, c.court, c.dateOpened)
		if err != nil {
			return err
		}
		id, _ := res.LastInsertId()
		caseIDs[i] = id
	}

	// Seed tasks
	tasks := []struct {
		title    string
		caseID   int64
		dueDate  time.Time
		status   string
		priority string
	}{
		{"Draft initial response to complaint", caseIDs[0], time.Now().AddDate(0, 0, 5), "Pending", "High"},
		{"Collect financial statements", caseIDs[1], time.Now().AddDate(0, 0, 12), "Pending", "Medium"},
		{"Review trademark registry documents", caseIDs[2], time.Now().AddDate(0, 0, -2), "Completed", "Low"},
		{"Schedule deposition with Acme CEO", caseIDs[0], time.Now().AddDate(0, 0, 20), "Pending", "High"},
	}

	for _, t := range tasks {
		_, err := db.Exec("INSERT INTO tasks (title, case_id, due_date, status, priority) VALUES (?, ?, ?, ?, ?)",
			t.title, t.caseID, t.dueDate, t.status, t.priority)
		if err != nil {
			return err
		}
	}

	// Seed invoices
	invoices := []struct {
		caseID     int64
		amount     float64
		dueDate    time.Time
		status     string
		issuedDate time.Time
		details    string
	}{
		{caseIDs[0], 4500.00, time.Now().AddDate(0, 0, 15), "Unpaid", time.Now().AddDate(0, -1, 0), "Drafting pleadings, initial consultations, client communications"},
		{caseIDs[1], 7200.00, time.Now().AddDate(0, 0, -5), "Overdue", time.Now().AddDate(0, -1, -5), "IRS negotiation prep, 12.5 billable hours audit assistance"},
		{caseIDs[2], 3000.00, time.Now().AddDate(0, 0, 30), "Paid", time.Now(), "IP document compilation and initial review fee"},
	}

	for _, inv := range invoices {
		_, err := db.Exec("INSERT INTO invoices (case_id, amount, due_date, status, issued_date, details) VALUES (?, ?, ?, ?, ?, ?)",
			inv.caseID, inv.amount, inv.dueDate, inv.status, inv.issuedDate, inv.details)
		if err != nil {
			return err
		}
	}

	return nil
}
