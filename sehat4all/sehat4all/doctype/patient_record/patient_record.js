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
                    ? `S4A-${new_number.toString().padStart(5, "0")}-${current_year}-ER`
                    : `S4A-${new_number.toString().padStart(5, "0")}-${current_year}`;

                frm.set_value("patient_id", patient_id);  // ✅ Storing in patient_id field
            }
        }
    });
}

frappe.ui.form.on('Patient Record', {
    years: function(frm) {
        update_age_and_dob(frm);
    },
    months: function(frm) {
        update_age_and_dob(frm);
    },
    days: function(frm) {
        update_age_and_dob(frm);
    }
});

function update_age_and_dob(frm) {
    let age_parts = [];

    let years = frm.doc.years || 0;
    let months = frm.doc.months || 0;
    let days = frm.doc.days || 0;

    if (years) age_parts.push(`${years} years`);
    if (months) age_parts.push(`${months} months`);
    if (days) age_parts.push(`${days} days`);

    frm.set_value('age', age_parts.join(' '));

    // Calculate Date of Birth
    let today = new Date();
    today.setFullYear(today.getFullYear() - years);
    today.setMonth(today.getMonth() - months);
    today.setDate(today.getDate() - days);

    let formatted_dob = ("0" + today.getDate()).slice(-2) + "-" + 
                        ("0" + (today.getMonth() + 1)).slice(-2) + "-" + 
                        today.getFullYear();

    frm.set_value('date_of_birth', formatted_dob);
}