package main

import (
	"log"
	"net/http"
	"test2-project/backend/handlers"
)

// CORSMiddleware adds proper CORS headers for modern dev environments
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	dbPath := "./law_management.db"
	db, err := InitDB(dbPath)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}
	defer db.Close()

	if err := SeedDB(db); err != nil {
		log.Printf("Warning: Seeding database failed: %v", err)
	}

	// Share db connection with handlers
	handlers.DB = db

	mux := http.NewServeMux()

	// Register API endpoints
	mux.HandleFunc("/api/dashboard", handlers.GetDashboardStats)
	
	mux.HandleFunc("/api/clients", handlers.HandleClients)
	mux.HandleFunc("/api/clients/", handlers.HandleClientByID)

	mux.HandleFunc("/api/cases", handlers.HandleCases)
	mux.HandleFunc("/api/cases/", handlers.HandleCaseByID)

	mux.HandleFunc("/api/tasks", handlers.HandleTasks)
	mux.HandleFunc("/api/tasks/", handlers.HandleTaskByID)

	mux.HandleFunc("/api/invoices", handlers.HandleInvoices)
	mux.HandleFunc("/api/invoices/", handlers.HandleInvoiceByID)

	port := ":8080"
	log.Printf("Backend server starting on http://localhost%s", port)
	if err := http.ListenAndServe(port, CORSMiddleware(mux)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
