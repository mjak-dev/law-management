package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"test2-project/backend/models"
	"time"
)

func HandleInvoices(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getInvoices(w, r)
	case http.MethodPost:
		createInvoice(w, r)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func HandleInvoiceByID(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 4 {
		WriteError(w, http.StatusBadRequest, "Invalid request path")
		return
	}
	idStr := parts[3]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid invoice ID")
		return
	}

	switch r.Method {
	case http.MethodPut:
		updateInvoice(w, r, id)
	case http.MethodDelete:
		deleteInvoice(w, r, id)
	default:
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}

func getInvoices(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT i.id, i.case_id, c.title as case_title, cl.name as client_name, 
		       i.amount, i.due_date, i.status, i.issued_date, i.details
		FROM invoices i
		JOIN cases c ON i.case_id = c.id
		JOIN clients cl ON c.client_id = cl.id
		ORDER BY i.issued_date DESC`

	rows, err := DB.Query(query)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var inv models.Invoice
		if err := rows.Scan(&inv.ID, &inv.CaseID, &inv.CaseTitle, &inv.ClientName,
			&inv.Amount, &inv.DueDate, &inv.Status, &inv.IssuedDate, &inv.Details); err != nil {
			WriteError(w, http.StatusInternalServerError, err.Error())
			return
		}
		invoices = append(invoices, inv)
	}

	if invoices == nil {
		invoices = []models.Invoice{}
	}

	WriteJSON(w, http.StatusOK, invoices)
}

func createInvoice(w http.ResponseWriter, r *http.Request) {
	var inv models.Invoice
	if err := json.NewDecoder(r.Body).Decode(&inv); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if inv.CaseID == 0 || inv.Amount <= 0 {
		WriteError(w, http.StatusBadRequest, "CaseID and Amount (greater than 0) are required")
		return
	}

	if inv.Status == "" {
		inv.Status = "Unpaid"
	}
	if inv.IssuedDate.IsZero() {
		inv.IssuedDate = time.Now()
	}
	if inv.DueDate.IsZero() {
		inv.DueDate = time.Now().AddDate(0, 0, 30) // default net-30
	}

	res, err := DB.Exec("INSERT INTO invoices (case_id, amount, due_date, status, issued_date, details) VALUES (?, ?, ?, ?, ?, ?)",
		inv.CaseID, inv.Amount, inv.DueDate, inv.Status, inv.IssuedDate, inv.Details)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	inv.ID = id

	// Fetch details
	DB.QueryRow(`
		SELECT c.title, cl.name 
		FROM cases c 
		JOIN clients cl ON c.client_id = cl.id 
		WHERE c.id = ?`, inv.CaseID).Scan(&inv.CaseTitle, &inv.ClientName)

	WriteJSON(w, http.StatusCreated, inv)
}

func updateInvoice(w http.ResponseWriter, r *http.Request, id int64) {
	var inv models.Invoice
	if err := json.NewDecoder(r.Body).Decode(&inv); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if inv.Status == "" {
		WriteError(w, http.StatusBadRequest, "Status is required")
		return
	}

	_, err := DB.Exec("UPDATE invoices SET status = ? WHERE id = ?", inv.Status, id)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Invoice updated successfully"})
}

func deleteInvoice(w http.ResponseWriter, r *http.Request, id int64) {
	res, err := DB.Exec("DELETE FROM invoices WHERE id = ?", id)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if rowsAffected == 0 {
		WriteError(w, http.StatusNotFound, "Invoice not found")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "Invoice deleted successfully"})
}
