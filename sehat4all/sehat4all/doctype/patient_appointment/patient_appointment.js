// Copyright (c) 2025, Admin and contributors
// For license information, please see license.txt

let phoneSearchTimeout;

frappe.ui.form.on("Patient Appointment", {
    phone_number: function (frm) {
        if (phoneSearchTimeout) {
            clearTimeout(phoneSearchTimeout);
        }

        phoneSearchTimeout = setTimeout(() => {
            if (frm.doc.phone_number) {
                frappe.call({
                    method: "frappe.client.get_list",
                    args: {
                        doctype: "Patient Record",
                        filters: {
                            contact_number: frm.doc.phone_number
                        },
                        fields: ["name", "patient_name", "contact_number"]
                    },
                    callback: function (response) {
                        let patients = response.message;
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
                                        frm.trigger("fetch_patient_data"); // Fetch data once selected
                                    }
                                },
                                "Select Patient",
                                "OK"
                            );
                        } else {
                           
                        }
                    }
                });
            }
        }, 5000); // 5-second delay
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
                    // Fetch and allow editing
                    frm.set_value("patient_name", patient.patient_name);
                    frm.set_value("age", patient.age);
                    frm.set_value("gender", patient.gender);
                    frm.set_value("weight", patient.weight);
                    frm.set_value("father_name", patient.father_name);
                    frm.set_value("cnic", patient.cnic);
                    frm.set_value("phone_number", patient.contact_number);
		    frm.set_value("address", patient.address);

                    // Ensure fields are editable
                    ["patient_name", "age", "gender", "weight", "father_name", "cnic", "phone_number", "address", "emergency"].forEach(field => {
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
                        "phone_number" : frm.doc.contact_number,
			"address": frm.doc.address
                    }
                },
                callback: function () {
                    
                }
            });
        }
    }
});

frappe.ui.form.on('Patient Appointment', {
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
frappe.ui.form.on('Patient Appointment', {
    refresh: function(frm) {
        // Add a custom button in the Patient Appointment form
        frm.add_custom_button('Create New Patient', function() {
            frappe.new_doc('Patient Appointment'); // Opens a new Patient form
        }, 'Actions'); // Group under 'Actions'

        frm.add_custom_button('View Appointments', function() {
            frappe.set_route('List', 'Patient Appointment'); // Navigates to the Patient Appointment list
        }, 'Actions'); // Group under 'Actions'
    }
});

frappe.ui.form.on('Patient Appointment', {
    after_save: function(frm) {
        // Create a custom dialog
        let dialog = new frappe.ui.Dialog({
            title: 'Appointment Submitted',
            fields: [
                {
                    fieldtype: 'HTML',
                    fieldname: 'message',
                    options: `
                        <div>
                            <p>Patient Appointment has been submitted successfully</p>
                            <a class="btn btn-sm btn-primary" 
                               href="/api/method/frappe.utils.print_format.download_pdf?doctype=Patient%20Appointment&name=${frm.doc.name}&format=Patient%20Appointment&no_letterhead=0&_lang=English" 
                               target="_blank">Get PDF</a>

                            <a class="btn btn-sm btn-success"  
                               href="/printview?doctype=Patient%20Appointment&name=${frm.doc.name}&trigger_print=1&format=Patient%20Appointment&no_letterhead=0" 
                               target="_blank">Print</a>

                        </div>
                    `
                }
            ],
            primary_action_label: 'Close',
            primary_action: function() {
                dialog.hide();
            }
        });

        dialog.show();

        // Automatically close the dialog after 10 seconds
        setTimeout(() => {
            dialog.hide();
        }, 2000); // 10 seconds
    }
});

// frappe.ui.form.on("Patient Appointment", {
// 	refresh(frm) {

// 	},
// });
// frappe.ui.form.on('Patient Appointment', {
//     years: function(frm) {
//         update_age_and_dob(frm);
//     },
//     months: function(frm) {
//         update_age_and_dob(frm);
//     },
//     days: function(frm) {
//         update_age_and_dob(frm);
//     },
//     date_of_birth: function(frm) {
//         update_age_fields(frm);
//     }
// });

// function update_age_and_dob(frm) {
//     let years = frm.doc.years || 0;
//     let months = frm.doc.months || 0;
//     let days = frm.doc.days || 0;

//     let today = new Date();
//     today.setFullYear(today.getFullYear() - years);
//     today.setMonth(today.getMonth() - months);
//     today.setDate(today.getDate() - days);

//     let dob = today.toISOString().split('T')[0]; 

//     frm.set_value('date_of_birth', dob);
//     frm.set_value('age', format_age(years, months, days));
// }

// function update_age_fields(frm) {
//     if (!frm.doc.date_of_birth) return;

//     let dob = frappe.datetime.str_to_obj(frm.doc.date_of_birth);
//     let today = new Date();
    
//     let years = today.getFullYear() - dob.getFullYear();
//     let months = today.getMonth() - dob.getMonth();
//     let days = today.getDate() - dob.getDate();

//     if (days < 0) {
//         months -= 1;
//         days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
//     }
//     if (months < 0) {
//         years -= 1;
//         months += 12;
//     }

//     frm.set_value('years', years);
//     frm.set_value('months', months);
//     frm.set_value('days', days);
//     frm.set_value('age', format_age(years, months, days));
// }

// function format_age(years, months, days) {
//     let age_parts = [];
//     if (years > 0) age_parts.push(`${years} years`);
//     if (months > 0) age_parts.push(`${months} months`);
//     if (days > 0) age_parts.push(`${days} days`);

//     return age_parts.join(' ');
// }

frappe.views.calendar["Patient Appointment"] = {
	field_map: {
		"start": "appointment_date",
		"end": "appointment_date",
		"id": "name",
		"title": "patient_name",
		"payment": "payment",
		"allDay": "allDay",
		"progress": "progress"
	}
};
frappe.ui.form.on('Patient Appointment', {
    setup: function(frm) {
        // Prevent dropdown list from showing all patient IDs
        frm.set_query("patient_id", function() {
            return {
                filters: { name: ["=", ""] }  // This prevents showing all records
            };
        });
    },

    patient_id: function(frm) {
        if (!frm.doc.patient_id) return;  // Exit if no ID is entered

        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Patient Record',  // Ensure this matches the actual Doctype name
                name: frm.doc.patient_id
            },
            callback: function(r) {
                if (r.message) {
                    // Existing patient: Refresh field to fetch details
                    frm.refresh_field("patient_id");
                }
            },
            error: function(err) {
                console.error("Error fetching patient:", err);
            }
        });
    }
});
frappe.listview_settings['Patient Appointment'] = {
    onload: function(listview) {
        if (frappe.session.user !== 'Administrator') {
            frappe.call({
                method: "frappe.client.get",
                args: {
                    doctype: "User",
                    name: frappe.session.user
                },
                callback: function(response) {
                    const user = response.message;
                    if (user && user.doctor) {
                        // Apply filter for the doctor's appointments
                        listview.filter_area.add([
                            ["Patient Appointment", "doctor", "=", user.doctor]
                        ]);
                        listview.refresh();
                    }
                }
            });
        }
    }
};
frappe.ui.form.on('Patient Appointment', {
    payment: function(frm) {
        update_remaining_total(frm);
    },

    discount: function(frm) {
        update_remaining_total(frm);
    }
});

function update_remaining_total(frm) {
    let payment = parseFloat(frm.doc.payment) || 0;
    let discount = parseFloat(frm.doc.discount) || 0;

    // If remaining_total is not set by Check Patient, set it to (payment - discount)
    if (!frm.doc.remaining_total) {
        frm.set_value('remaining_total', payment - discount);
    }
}
frappe.ui.form.on("Patient Appointment", {
    doctor_id: function(frm) {
        if (frm.doc.doctor_id) {
            let name_parts = frm.doc.doctor_id.split(" ");

            // Remove "Dr." if it's the first part of the name
            if (name_parts[0].toLowerCase() === "dr.") {
                name_parts.shift(); // Remove first element
            }

            let initials = name_parts.map(part => part.charAt(0)).join("");
            frm.set_value("doctor_initials", initials);
        }
    }
});
frappe.ui.form.on("Patient Appointment", {
    doctor_id: function(frm) {  
        if (!frm.doc.doctor_id || !frm.doc.appointment_date) {
            console.log("❌ Doctor or appointment date is missing");
            return;
        }

        console.log("✅ Doctor selected:", frm.doc.doctor_id, "Date:", frm.doc.appointment_date);

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Patient Appointment",
                filters: {
                    doctor_id: frm.doc.doctor_id,
                    appointment_date: frm.doc.appointment_date
                },
                fields: ["appointment_number"],
                order_by: "appointment_number desc",  // Ensuring correct sorting
                limit_page_length: 1
            },
            callback: function(r) {
                console.log("🔍 Last appointment:", r.message);

                let serial = 1;
                if (r.message && r.message.length > 0 && r.message[0].appointment_number) {
                    let last_number = parseInt(r.message[0].appointment_number) || 0;
                    serial = last_number + 1;
                }

                let formatted_serial = String(serial).padStart(3, "0");
                let new_appointment_number = formatted_serial;

                console.log("📌 New appointment number:", new_appointment_number);
                frm.set_value("appointment_number", new_appointment_number);
            }
        });
    }
});
