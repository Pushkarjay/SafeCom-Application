flowchart TD

subgraph group_suite["SafeCom Suite"]
  node_suite_root["SafeCom<br/>product suite"]
end

subgraph group_backend["Backend"]
  node_backend_app["API server<br/>ts service<br/>[app.ts]"]
  node_backend_routes["Route layer<br/>api routes"]
  node_backend_middleware["Auth guard<br/>middleware"]
  node_backend_services["Domain services<br/>service layer"]
  node_backend_contracts["API contracts<br/>shared contracts"]
end

subgraph group_apps["Client Apps"]
  node_admin_app["Admin dashboard<br/>react app<br/>[App.tsx]"]
  node_admin_auth["Admin auth<br/>ui feature<br/>[login_screen.tsx]"]
  node_admin_catalog["Catalog tools<br/>ui feature"]
  node_admin_ops["Ops console<br/>ui feature"]
  node_admin_sdui["SDUI builder<br/>ui feature"]
  node_customer_app["Customer app<br/>flutter app<br/>[main.dart]"]
  node_customer_sdui["SDUI renderer<br/>flutter sdui<br/>[sdui_renderer.dart]"]
  node_customer_booking["Booking flow<br/>flutter feature"]
  node_employee_app["Employee app<br/>flutter app<br/>[main.dart]"]
  node_employee_jobs["Jobs flow<br/>flutter feature"]
end

subgraph group_dataops["Data & Ops"]
  node_firestore_data[("Firestore model<br/>data store<br/>[firestore.rules]")]
  node_seeding_tools["Seed & migrate<br/>ops tooling<br/>[seed-firestore.ts]"]
  node_deploy_stack["Deploy stack<br/>deployment"]
  node_docs_plan["Docs & plans<br/>documentation<br/>[SRS_Index.md]"]
end

node_suite_root -->|"core API"| node_backend_app
node_suite_root -->|"admin console"| node_admin_app
node_suite_root -->|"customer client"| node_customer_app
node_suite_root -->|"employee client"| node_employee_app
node_backend_app -->|"dispatches"| node_backend_routes
node_backend_app -->|"protects"| node_backend_middleware
node_backend_app -->|"orchestrates"| node_backend_services
node_backend_routes -->|"typed payloads"| node_backend_contracts
node_backend_services -->|"reads/writes"| node_firestore_data
node_backend_services -->|"renders"| node_backend_contracts
node_admin_app -->|"admin API"| node_backend_app
node_admin_app -->|"auth"| node_admin_auth
node_admin_app -->|"catalog mgmt"| node_admin_catalog
node_admin_app -->|"ops mgmt"| node_admin_ops
node_admin_app -->|"build SDUI"| node_admin_sdui
node_admin_sdui -->|"publishes"| node_backend_contracts
node_customer_app -->|"customer API"| node_backend_app
node_customer_app -->|"renders"| node_customer_sdui
node_customer_booking -->|"checkout"| node_backend_app
node_customer_app -.->|"consumes data"| node_firestore_data
node_employee_app -->|"field API"| node_backend_app
node_employee_jobs -->|"status updates"| node_backend_app
node_backend_app -->|"deployed via"| node_deploy_stack
node_admin_app -->|"hosted on"| node_deploy_stack
node_backend_app -.->|"bootstraps"| node_seeding_tools
node_seeding_tools -->|"initializes"| node_firestore_data
node_docs_plan -.->|"describes"| node_backend_app
node_docs_plan -.->|"describes"| node_admin_app
node_docs_plan -.->|"describes"| node_customer_app
node_docs_plan -.->|"describes"| node_employee_app

click node_backend_app "https://github.com/pushkarjay/safecom-application/blob/main/backend_server/src/app.ts"
click node_backend_routes "https://github.com/pushkarjay/safecom-application/tree/main/backend_server/src/routes"
click node_backend_middleware "https://github.com/pushkarjay/safecom-application/tree/main/backend_server/src/middleware"
click node_backend_services "https://github.com/pushkarjay/safecom-application/tree/main/backend_server/src/services"
click node_backend_contracts "https://github.com/pushkarjay/safecom-application/tree/main/backend_server/src/contracts"
click node_admin_app "https://github.com/pushkarjay/safecom-application/blob/main/Admin/web_app/admin-dashboard/src/App.tsx"
click node_admin_auth "https://github.com/pushkarjay/safecom-application/blob/main/Admin/web_app/admin-dashboard/src/features/auth/login_screen.tsx"
click node_admin_catalog "https://github.com/pushkarjay/safecom-application/tree/main/Admin/web_app/admin-dashboard/src/features/catalog"
click node_admin_ops "https://github.com/pushkarjay/safecom-application/tree/main/Admin/web_app/admin-dashboard/src/features/dashboard"
click node_admin_sdui "https://github.com/pushkarjay/safecom-application/blob/main/Admin/web_app/admin-dashboard/src/features/catalog/service_tree_builder_screen.tsx"
click node_customer_app "https://github.com/pushkarjay/safecom-application/blob/main/mobile_customer/lib/main.dart"
click node_customer_sdui "https://github.com/pushkarjay/safecom-application/blob/main/mobile_customer/lib/core/sdui/sdui_renderer.dart"
click node_customer_booking "https://github.com/pushkarjay/safecom-application/tree/main/mobile_customer/lib/features/booking"
click node_employee_app "https://github.com/pushkarjay/safecom-application/blob/main/mobile_employee/lib/main.dart"
click node_employee_jobs "https://github.com/pushkarjay/safecom-application/tree/main/mobile_employee/lib/features/jobs"
click node_firestore_data "https://github.com/pushkarjay/safecom-application/blob/main/firestore.rules"
click node_seeding_tools "https://github.com/pushkarjay/safecom-application/blob/main/backend_server/scripts/seed-firestore.ts"
click node_deploy_stack "https://github.com/pushkarjay/safecom-application/tree/main/backend_server/Dockerfile"
click node_docs_plan "https://github.com/pushkarjay/safecom-application/blob/main/docs/SRS_Index.md"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_suite_root toneBlue
class node_backend_app,node_backend_routes,node_backend_middleware,node_backend_services,node_backend_contracts toneAmber
class node_admin_app,node_admin_auth,node_admin_catalog,node_admin_ops,node_admin_sdui,node_customer_app,node_customer_sdui,node_customer_booking,node_employee_app,node_employee_jobs toneMint
class node_firestore_data,node_seeding_tools,node_deploy_stack,node_docs_plan toneRose