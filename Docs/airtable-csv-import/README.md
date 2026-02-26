# Airtable CSV import – Nanny Whisperer

These CSVs define the **column names** (field names) for each table. Import one CSV per table into your Airtable base.

## How to import

1. Open your base at [airtable.com](https://airtable.com).
2. **Add or import a table**: Click **+ Add or import** → **Import data** → **CSV file**.
3. Choose the CSV (e.g. `Users.csv`). Airtable will create a table with the first row as field names.
4. **Rename the new table** to match exactly: **Users**, **Hosts**, **Nannies**, **Matches**, **Shortlists**, **Conversations**, **Messages**, **InterviewRequests**, **PasswordResetTokens**, **GoogleCalendarTokens**.
5. Repeat for each CSV (one table per CSV).

## Files

| CSV file | Airtable table name |
|----------|----------------------|
| Users.csv | **Users** |
| Hosts.csv | **Hosts** |
| Nannies.csv | **Nannies** |
| Matches.csv | **Matches** |
| Shortlists.csv | **Shortlists** |
| Conversations.csv | **Conversations** |
| Messages.csv | **Messages** |
| InterviewRequests.csv | **InterviewRequests** |
| PasswordResetTokens.csv | **PasswordResetTokens** |
| GoogleCalendarTokens.csv | **GoogleCalendarTokens** |

## After import

- Change **field types** in Airtable as needed (e.g. Single select for `userType`, Checkbox for booleans, Number for `score`, `maxChildren`, etc.). See [Airtable-Setup-Guide.md](../Airtable-Setup-Guide.md) for types.
- For **Shortlists**, consider changing `matchIds` to **Link to another record** (Matches) if you want linked records.
- Delete the empty row if Airtable created one; the app only needs the correct field names.
