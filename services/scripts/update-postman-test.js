import fs from "node:fs";

const colPath = "docs/postman/SIMRS_Outpatient_Collection.json";
const col = JSON.parse(fs.readFileSync(colPath, "utf8"));
const f12 = col.item.find((i) => i.name.startsWith("12."));

// Request 3 (Buat order)
const req3 = f12.item[2];
req3.event = [
  {
    listen: "test",
    script: {
      type: "text/javascript",
      exec: [
        'pm.test("Status 201 Created - Order Lab Berhasil Dibuat", function () {',
        "    pm.response.to.have.status(201);",
        "    var d = pm.response.json().data;",
        '    pm.collectionVariables.set("lab_order_id", String(d.id));',
        '    pm.environment.set("lab_order_id", String(d.id));',
        "    if (d.items && d.items.length >= 2) {",
        '        pm.collectionVariables.set("lab_item_1_id", String(d.items[0].id));',
        '        pm.collectionVariables.set("lab_item_2_id", String(d.items[1].id));',
        '        pm.environment.set("lab_item_1_id", String(d.items[0].id));',
        '        pm.environment.set("lab_item_2_id", String(d.items[1].id));',
        "    }",
        "});",
      ],
    },
  },
];

// Request 7 (Input & Verifikasi Hasil Uji)
const req7 = f12.item[6];
req7.request.body.raw = JSON.stringify(
  {
    completed_by: 6,
    items: [
      {
        id: "{{lab_item_1_id}}",
        result_value: "14.6",
        reference_range: "13.0 - 17.0",
        unit: "g/dL",
        status_flag: "NORMAL",
        notes: "Dalam batas rujukan normal",
      },
      {
        id: "{{lab_item_2_id}}",
        result_value: "238",
        reference_range: "70 - 100",
        unit: "mg/dL",
        status_flag: "ABNORMAL",
        notes: "Hiperglikemia puasa, konfirmasi klinis DPJP",
      },
    ],
  },
  null,
  2
).replace('"{{lab_item_1_id}}"', '{{lab_item_1_id}}')
 .replace('"{{lab_item_2_id}}"', '{{lab_item_2_id}}');

// Request 8 (Uji RBAC)
const req8 = f12.item[7];
req8.request.body.raw = JSON.stringify(
  {
    items: [
      {
        id: "{{lab_item_1_id}}",
        result_value: "14.2",
        status_flag: "NORMAL",
      },
    ],
  },
  null,
  2
).replace('"{{lab_item_1_id}}"', '{{lab_item_1_id}}');

fs.writeFileSync(colPath, JSON.stringify(col, null, 2), "utf8");
console.log("Collection updated successfully with dynamic item IDs.");
