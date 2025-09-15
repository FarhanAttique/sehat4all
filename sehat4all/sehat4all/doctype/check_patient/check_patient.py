# Copyright (c) 2024, Shahab Maqsood and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class CheckPatient(Document):
	def before_submit(self):
		if self.appointment_no:
			appointment = frappe.get_doc("Patient Appointment", self.appointment_no)

			if appointment.docstatus == 0:  # If in draft state
				appointment.status = "Completed"
				appointment.submit()
				frappe.msgprint(f"Patient Appointment {self.appointment_no} has been automatically updated to 'Completed' and submitted.")

			elif appointment.docstatus == 1:  # If already submitted
				if appointment.status != "Completed":
					appointment.status = "Completed"
					appointment.save()
					frappe.msgprint(f"Status of Patient Appointment {self.appointment_no} has been updated to 'Completed'.")

			else:
				frappe.throw(f"Cannot submit cancelled Patient Appointment {self.appointment_no}.")