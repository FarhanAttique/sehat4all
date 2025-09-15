import frappe
from frappe.model.document import Document
from datetime import datetime

class PatientRecord(Document):
    def before_insert(self):
        # Get current month and year
        current_month = datetime.now().strftime("%m")  # MM format
        current_year = datetime.now().strftime("%Y")  # YYYY format

        # Determine the field to track last number
        last_number_field = "last_number"

        # Fetch last used number and stored year
        last_number = frappe.db.get_single_value("Patient Numbering", last_number_field) or 0
        last_used_year = frappe.db.get_single_value("Patient Numbering", "last_used_year") or current_year

        # Reset numbering if the year has changed
        if str(last_used_year) != current_year:
            last_number = 0  # Reset numbering for the new year
            frappe.db.set_value("Patient Numbering", None, "last_used_year", current_year)  # Store new year

        new_number = last_number + 1

        # Generate patient ID with Month-Year
        if self.emergency:
            self.patient_id = f"CSH-{new_number:05d}-{current_month}-{current_year}-ER"
        else:
            self.patient_id = f"CSH-{new_number:05d}-{current_month}-{current_year}"

        # Update last_number in Patient Numbering
        frappe.db.set_value("Patient Numbering", None, last_number_field, new_number)
