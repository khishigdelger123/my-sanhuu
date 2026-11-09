CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY,
	"owner" text NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(16,2) NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"account" text NOT NULL,
	"date" date NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
