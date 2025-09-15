// Copyright (c) 2024, Shahab Maqsood and contributors
// For license information, please see license.txt

frappe.ui.form.on('Check Patient', {
    setup: function(frm) {
        frm.set_query("appointment_no", function() {
            return {
                filters: {
                    docstatus: 0  // Show only Draft (unsaved/submittable) appointments
                }
            };
        });
    },

    discount: function(frm) {
        if (frm.doc.payment && frm.doc.discount) {
            let remaining_total = frm.doc.payment - frm.doc.discount;
            frm.set_value('remaining_total', remaining_total);

            if (frm.doc.appointment_no) {
                frappe.call({
                    method: 'frappe.client.get',
                    args: {
                        doctype: 'Patient Appointment',
                        name: frm.doc.appointment_no
                    },
                    callback: function(r) {
                        if (r.message) {
                            let appointment = r.message;
                            appointment.discount = frm.doc.discount;
                            appointment.remaining_total = remaining_total;

                            frappe.call({
                                method: 'frappe.client.save',
                                args: { doc: appointment },
                                callback: function(save_res) {
                                    if (save_res.message) {
                                        frappe.show_alert({
                                            message: __('Patient Appointment updated successfully'),
                                            indicator: 'green'
                                        });
                                    }
                                },
                                error: function(err) {
                                    frappe.msgprint(__('Failed to update Patient Appointment'));
                                }
                            });
                        } else {
                            frappe.msgprint(__('Patient Appointment not found'));
                        }
                    },
                    error: function(err) {
                        frappe.msgprint(__('Failed to fetch Patient Appointment'));
                    }
                });
            }
        }
    },
    
    payment: function(frm) {
        if (frm.doc.discount) {
            frm.trigger('discount');
        }
    },

    onload: function(frm) {  // Changed from 'refresh' to 'onload'
        ensure_new_row(frm, "report", "Presenting Complaints Table", "presenting_complaints");
        ensure_new_row(frm, "report1", "Medical Examination Findings Table", "medical_examination_findings");
        ensure_new_row(frm, "report2", "Patient Report", "prescription");
        ensure_new_row(frm, "lab_tests", "Lab Tests", "lab_tests");
    }
});

// Child Table Event Handlers
frappe.ui.form.on('Presenting Complaints Table', {
    presenting_complaints: function(frm, cdt, cdn) {
        ensure_new_row(frm, "report", "Presenting Complaints Table", "presenting_complaints");
    }
});

frappe.ui.form.on('Medical Examination Findings Table', {
    medical_examination_findings: function(frm, cdt, cdn) {
        ensure_new_row(frm, "report1", "Medical Examination Findings Table", "medical_examination_findings");
    }
});

frappe.ui.form.on('Patient Report', {
    prescription: function(frm, cdt, cdn) {
        ensure_new_row(frm, "report2", "Patient Report", "prescription");
    }
});

frappe.ui.form.on('Lab Tests', {
    lab_tests: function(frm, cdt, cdn) {
        ensure_new_row(frm, "lab_tests", "Lab Tests", "lab_tests");
    }
});

// Improved ensure_new_row() Function
function ensure_new_row(frm, parent_fieldname, child_doctype, trigger_field) {
    let child_table = frm.doc[parent_fieldname] || [];

    if (child_table.length === 0) {
        frm.add_child(parent_fieldname);
    } else {
        let last_row = child_table[child_table.length - 1];

        // Add a new row only if the last row has data AND required fields are filled
        if (last_row && last_row[trigger_field] && last_row.idx) {
            frm.add_child(parent_fieldname);
        }
    }

    frm.refresh_field(parent_fieldname);
} 

let phoneSearchTimeout;

frappe.ui.form.on("Check Patient", {
    phone: function (frm) {
        if (phoneSearchTimeout) {
            clearTimeout(phoneSearchTimeout);
        }

        phoneSearchTimeout = setTimeout(() => {
            if (frm.doc.phone) {
                frappe.call({
                    method: "frappe.client.get_list",
                    args: {
                        doctype: "Patient Record",
                        filters: {
                            contact_number: frm.doc.phone
                        },
                        fields: ["name", "patient_name", "contact_number"]
                    },
                    callback: function (response) {
                        let patients = response.message || [];
                        if (patients.length > 0) {
                            let options = patients.map(patient => ({
                                label: `${patient.patient_name} (${patient.contact_number})`,
                                value: patient.name
                            }));

                            frappe.prompt(
                                [
                                    {
                                        label: "Select Patient",
                                        fieldname: "selected_patient",
                                        fieldtype: "Select",
                                        options: options.map(opt => opt.label)
                                    }
                                ],
                                (data) => {
                                    let selected = options.find(opt => opt.label === data.selected_patient);
                                    if (selected) {
                                        frm.set_value("patient_id", selected.value);
                                        frm.trigger("fetch_patient_data");
                                    }
                                },
                                "Select Patient",
                                "OK"
                            );
                        } else {
                            frappe.msgprint("No patient found with this phone number.");
                        }
                    }
                });
            }
        }, 5000); // 1-second delay
    },

    patient_id: function (frm) {
        if (frm.doc.patient_id) {
            frm.trigger("fetch_patient_data");
        }
    },

    fetch_patient_data: function (frm) {
        frappe.call({
            method: "frappe.client.get",
            args: {
                doctype: "Patient Record",
                name: frm.doc.patient_id
            },
            callback: function (response) {
                let patient = response.message;
                if (patient) {
                    frm.set_value("patient_name", patient.patient_name);
                    frm.set_value("age", patient.age);
                    frm.set_value("gender", patient.gender);
                    frm.set_value("weight", patient.weight);
                    frm.set_value("father_name", patient.father_name);
                    frm.set_value("cnic", patient.cnic);
                    frm.set_value("phone", patient.contact_number);
                    frm.set_value("address", patient.address);

                    // Make sure fields are editable
                    ["patient_name", "age", "gender", "weight", "father_name", "cnic", "phone", "address", "emergency"].forEach(field => {
                        frm.set_df_property(field, "read_only", 0);
                    });
                }
            }
        });
    },

    after_save: function (frm) {
        if (frm.doc.patient_id) {
            frappe.call({
                method: "frappe.client.set_value",
                args: {
                    doctype: "Patient Record",
                    name: frm.doc.patient_id,
                    fieldname: {
                        "patient_name": frm.doc.patient_name,
                        "age": frm.doc.age,
                        "gender": frm.doc.gender,
                        "weight": frm.doc.weight,
                        "father_name": frm.doc.father_name,
                        "cnic": frm.doc.cnic,
                        "contact_number": frm.doc.phone, // fixed mapping
                        "address": frm.doc.address
                    }
                }
            });
        }
    }
});
