package handlers

import (
	"net/http"
	"test2-project/backend/models"
)

func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		WriteError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var stats models.DashboardStats

	// Active cases
	err := DB.QueryRow("SELECT COUNT(*) FROM cases WHERE status = 'Open'").Scan(&stats.ActiveCases)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Pending tasks
	err = DB.QueryRow("SELECT COUNT(*) FROM tasks WHERE status = 'Pending'").Scan(&stats.PendingTasks)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Total clients
	err = DB.QueryRow("SELECT COUNT(*) FROM clients").Scan(&stats.TotalClients)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Unpaid invoices (Unpaid + Overdue)
	err = DB.QueryRow("SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status IN ('Unpaid', 'Overdue')").Scan(&stats.UnpaidInvoices)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	WriteJSON(w, http.StatusOK, stats)
}
