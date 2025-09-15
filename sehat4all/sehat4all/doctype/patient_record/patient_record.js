// Copyright (c) 2025, Admin and contributors
// For license information, please see license.txt


frappe.ui.form.on("Patient Record", {
    refresh: function(frm) {
        if (frm.is_new()) {
            generate_patient_id(frm);
        }
    },
    emergency: function(frm) {
        generate_patient_id(frm);
    }
});

function generate_patient_id(frm) {
    let is_emergency = frm.doc.emergency || 0;
    let current_year = new Date().getFullYear();

    frappe.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Patient Numbering",
            fieldname: is_emergency ? "last_number_er" : "last_number"
        },
        callback: function(response) {
            if (response.message) {
                let last_number = response.message[is_emergency ? "last_number_er" : "last_number"] || 0;
                let new_number = last_number + 1;
                let patient_id = is_emergency
                    ? `CSH-${new_number.toString().padStart(5, "0")}-${current_year}-ER`
                    : `CSH-${new_number.toString().padStart(5, "0")}-${current_year}`;

                frm.set_value("patient_id", patient_id);  // ✅ Storing in patient_id field
            }
        }
    });
}
