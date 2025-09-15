import frappe
def execute(filters=None):
    if filters.get('from_date') and filters.get('to_date'):
        # Define columns
        columns = [
            {"label": "Appointment No", "fieldname": "appointment_no", "fieldtype": "Data", "width": 120},
            {"label": "Patient ID", "fieldname": "patient_id", "fieldtype": "Data", "width": 120},
            {"label": "Patient Name", "fieldname": "patient_name", "fieldtype": "Data", "width": 200},
            {"label": "Doctor Name", "fieldname": "doctor_id", "fieldtype": "Data", "width": 200},
            {"label": "Age", "fieldname": "age", "fieldtype": "Int", "width": 80},
            {"label": "Weight", "fieldname": "weight", "fieldtype": "Float", "width": 80},
            {"label": "Gender", "fieldname": "gender", "fieldtype": "Data", "width": 80},
            {"label": "Phone", "fieldname": "phone", "fieldtype": "Data", "width": 120},
            {"label": "Diagnosis", "fieldname": "diagnosis", "fieldtype": "Data", "width": 250},
            {"label": "Advice", "fieldname": "advice", "fieldtype": "Data", "width": 250},
            {"label": "Note", "fieldname": "note", "fieldtype": "Data", "width": 250},
            {"label": "Presenting Complaints", "fieldname": "presenting_complaints", "fieldtype": "Data", "width": 300},
            {"label": "Medical Examination Findings", "fieldname": "medical_examination_findings", "fieldtype": "Data", "width": 300},
            {"label": "Patient Report", "fieldname": "patient_report", "fieldtype": "Data", "width": 300},
            {"label": "Lab Tests", "fieldname": "lab_tests", "fieldtype": "Data", "width": 200},
            {"label": "Visit Date", "fieldname": "visit_date", "fieldtype": "Date", "width": 120},
        ]

        # SQL query with necessary joins
        query = """
            SELECT 
                cp.appointment_no, 
                cp.patient_id, 
                cp.patient_name, 
                cp.doctor_id AS doctor_id, 
                cp.age, 
                cp.weight, 
                cp.gender, 
                cp.phone, 
                cp.diagnosis, 
                cp.advice, 
                cp.note, 
                cp.visit_date,
                GROUP_CONCAT(DISTINCT pc.presenting_complaints SEPARATOR ', ') AS presenting_complaints,
                GROUP_CONCAT(DISTINCT mef.medical_examination_findings SEPARATOR ', ') AS medical_examination_findings,
                GROUP_CONCAT(DISTINCT CONCAT(prt.prescription, ' (', prt.duration, ' - ', prt.quantity, ')') SEPARATOR ', ') AS patient_report,
                GROUP_CONCAT(DISTINCT lt.lab_tests SEPARATOR ', ') AS lab_tests
            FROM `tabCheck Patient` cp
            LEFT JOIN `tabPresenting Complaints Table` pc ON pc.parent = cp.name
            LEFT JOIN `tabMedical Examination Findings Table` mef ON mef.parent = cp.name
            LEFT JOIN `tabPatient Report` prt ON prt.parent = cp.name
            LEFT JOIN `tablab tests` lt ON lt.parent = cp.name
            WHERE cp.docstatus IN (0, 1)
                AND cp.visit_date BETWEEN %s AND %s
        """

        # Prepare conditions and values
        values = [filters.get('from_date'), filters.get('to_date')]
        conditions = ""

        if filters.get('appointment_no'):
            conditions += " AND cp.appointment_no = %s"
            values.append(filters.get('appointment_no'))

        if filters.get('patient_id'):
            conditions += " AND cp.patient_id = %s"
            values.append(filters.get('patient_id'))

        # Complete query with conditions
        query += conditions + " GROUP BY cp.name ORDER BY cp.visit_date, cp.appointment_no"

        # Execute query
        raw_data = frappe.db.sql(query, values, as_dict=True)

        return columns, raw_data

    return [], []
