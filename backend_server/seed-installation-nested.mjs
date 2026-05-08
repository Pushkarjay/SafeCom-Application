import admin from 'firebase-admin';
import fs from 'fs';

const key = JSON.parse(fs.readFileSync('service-account-key.json', 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: 'safecom-application-01'
});

import { getFirestore } from 'firebase-admin/firestore';
const db = getFirestore(admin.app(), 'safecom-database-nosql');

async function seedProducts() {
  const products = [
    { id: 'prod_dvr_cam_basic', name: 'DVR Camera (Basic)', category: 'Cameras', group: 'Core', unit: 'unit', price: 1200, status: 'active' },
    { id: 'prod_ip_cam_basic', name: 'IP Camera (Basic)', category: 'Cameras', group: 'Core', unit: 'unit', price: 1800, status: 'active' },
    { id: 'prod_wifi_cam', name: 'Wi-Fi Camera', category: 'Cameras', group: 'Core', unit: 'unit', price: 2500, status: 'active' },
    { id: 'prod_nvr_4ch', name: '4 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 4000, status: 'active' },
    { id: 'prod_nvr_8ch', name: '8 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 6000, status: 'active' },
    { id: 'prod_nvr_16ch', name: '16 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 9000, status: 'active' },
    { id: 'prod_nvr_32ch', name: '32 Channel NVR', category: 'Recording', group: 'Package Base', unit: 'unit', price: 15000, status: 'active' },
    { id: 'prod_power_supply_4ch', name: '4CH Power Supply', category: 'Power', group: 'Accessories', unit: 'unit', price: 500, status: 'active' },
    { id: 'prod_power_supply_8ch', name: '8CH Power Supply', category: 'Power', group: 'Accessories', unit: 'unit', price: 800, status: 'active' },
    { id: 'prod_poe_switch_4ch', name: '4CH PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 1500, status: 'active' },
    { id: 'prod_poe_switch_8ch', name: '8CH PoE Switch', category: 'Network', group: 'Accessories', unit: 'unit', price: 2500, status: 'active' },
    { id: 'prod_hdd_1tb', name: '1TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 3500, status: 'active' },
    { id: 'prod_hdd_2tb', name: '2TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 4800, status: 'active' },
    { id: 'prod_hdd_4tb', name: '4TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 8000, status: 'active' },
    { id: 'prod_hdd_8tb', name: '8TB Surveillance HDD', category: 'Storage', group: 'Core', unit: 'unit', price: 14000, status: 'active' },
    { id: 'prod_cable_3plus1', name: '3+1 CCTV Cable (Roll)', category: 'Cabling', group: 'Accessories', unit: 'coil', price: 800, status: 'active' },
    { id: 'prod_cable_cat6', name: 'Cat6 Cable (Roll)', category: 'Cabling', group: 'Accessories', unit: 'coil', price: 1200, status: 'active' },
    { id: 'prod_junction_box', name: 'Camera Junction Box', category: 'Mounting', group: 'Accessories', unit: 'unit', price: 150, status: 'active' },
    { id: 'prod_connectors_pack', name: 'BNC/DC Connectors (Pack)', category: 'Accessories', group: 'Accessories', unit: 'pack', price: 200, status: 'active' },
    { id: 'srv_installation_charge_per_cam', name: 'Per Camera Installation Charge', category: 'Services', group: 'Labor', unit: 'unit', price: 300, status: 'active' }
  ];

  console.log('📦 Seeding products...');
  for (const p of products) {
    await db.collection('catalog_product').doc(p.id).set(p);
    console.log('✅', p.id);
  }
  console.log('✅ Products seeded');
}

function getProductRef(id) {
  return db.collection('catalog_product').doc(id);
}

const installationData = {
  "DVR": {
    "4 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_dvr_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_dvr_cam_basic'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_4ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_4ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_1tb'),
          "Product 3 Option 1 ID": getProductRef('prod_hdd_1tb'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_power_supply_4ch'),
          "Product 4 Option 1 ID": getProductRef('prod_power_supply_4ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_cable_3plus1'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_3plus1'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 4,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      }
    },
    "8 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_dvr_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_dvr_cam_basic'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_8ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_8ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_2tb'),
          "Product 3 Option 1 ID": getProductRef('prod_hdd_2tb'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_power_supply_8ch'),
          "Product 4 Option 1 ID": getProductRef('prod_power_supply_8ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_cable_3plus1'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_3plus1'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 8,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      }
    },
    "16 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 16,
          "Price": getProductRef('prod_dvr_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_dvr_cam_basic'),
          "available": true,
          "max q": 16,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_16ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_16ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_4tb'),
          "Product 3 Option 1 ID": getProductRef('prod_hdd_4tb'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_power_supply_8ch'),
          "Product 4 Option 1 ID": getProductRef('prod_power_supply_8ch'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_cable_3plus1'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_3plus1'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 16,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 16,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 16,
          "min q": 1,
          "rigid": false
        }
      }
    }
  },
  "IP Camera": {
    "4 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_ip_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_ip_cam_basic'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_4ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_4ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_poe_switch_4ch'),
          "Product 3 Option 1 ID": getProductRef('prod_poe_switch_4ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_1tb'),
          "Product 4 Option 1 ID": getProductRef('prod_hdd_1tb'),
          "available": true,
          "max q": 2,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_cable_cat6'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_cat6'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 4,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      }
    },
    "8 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_ip_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_ip_cam_basic'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_8ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_8ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_poe_switch_8ch'),
          "Product 3 Option 1 ID": getProductRef('prod_poe_switch_8ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_2tb'),
          "Product 4 Option 1 ID": getProductRef('prod_hdd_2tb'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_cable_cat6'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_cat6'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 8,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      }
    },
    "16 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 16,
          "Price": getProductRef('prod_ip_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_ip_cam_basic'),
          "available": true,
          "max q": 16,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_16ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_16ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_poe_switch_8ch'),
          "Product 3 Option 1 ID": getProductRef('prod_poe_switch_8ch'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_4tb'),
          "Product 4 Option 1 ID": getProductRef('prod_hdd_4tb'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_cable_cat6'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_cat6'),
          "available": true,
          "max q": 16,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 16,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 16,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 16,
          "min q": 1,
          "rigid": false
        }
      }
    },
    "32 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 32,
          "Price": getProductRef('prod_ip_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_ip_cam_basic'),
          "available": true,
          "max q": 32,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_32ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_32ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_poe_switch_8ch'),
          "Product 3 Option 1 ID": getProductRef('prod_poe_switch_8ch'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_8tb'),
          "Product 4 Option 1 ID": getProductRef('prod_hdd_8tb'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 16,
          "Price": getProductRef('prod_cable_cat6'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_cat6'),
          "available": true,
          "max q": 32,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 32,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 32,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 32,
          "min q": 1,
          "rigid": false
        }
      }
    }
  },
  "Wi-Fi Camera": {
    "Custom Wi-Fi Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_wifi_cam'),
          "Product 1 Option 1 ID": getProductRef('prod_wifi_cam'),
          "available": true,
          "max q": 10,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 2 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 10,
          "min q": 1,
          "rigid": false
        }
      }
    }
  },
  "TVI Camera": {
    "4 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_dvr_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_dvr_cam_basic'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_4ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_4ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_1tb'),
          "Product 3 Option 1 ID": getProductRef('prod_hdd_1tb'),
          "available": true,
          "max q": 2,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_power_supply_4ch'),
          "Product 4 Option 1 ID": getProductRef('prod_power_supply_4ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_cable_3plus1'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_3plus1'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 4,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 4,
          "min q": 1,
          "rigid": false
        }
      }
    },
    "8 Camera Setup": {
      "Product 1": {
        "Product 1 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_dvr_cam_basic'),
          "Product 1 Option 1 ID": getProductRef('prod_dvr_cam_basic'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 2": {
        "Product 2 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_nvr_8ch'),
          "Product 2 Option 1 ID": getProductRef('prod_nvr_8ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 3": {
        "Product 3 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_hdd_2tb'),
          "Product 3 Option 1 ID": getProductRef('prod_hdd_2tb'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 4": {
        "Product 4 Option 1": {
          "Deafult q": 1,
          "Price": getProductRef('prod_power_supply_8ch'),
          "Product 4 Option 1 ID": getProductRef('prod_power_supply_8ch'),
          "available": true,
          "max q": 1,
          "min q": 1,
          "rigid": true
        }
      },
      "Product 5": {
        "Product 5 Option 1": {
          "Deafult q": 4,
          "Price": getProductRef('prod_cable_3plus1'),
          "Product 5 Option 1 ID": getProductRef('prod_cable_3plus1'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 6": {
        "Product 6 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('prod_junction_box'),
          "Product 6 Option 1 ID": getProductRef('prod_junction_box'),
          "available": true,
          "max q": 8,
          "min q": 0,
          "rigid": false
        }
      },
      "Product 7": {
        "Product 7 Option 1": {
          "Deafult q": 2,
          "Price": getProductRef('prod_connectors_pack'),
          "Product 7 Option 1 ID": getProductRef('prod_connectors_pack'),
          "available": true,
          "max q": 2,
          "min q": 1,
          "rigid": false
        }
      },
      "Product 8": {
        "Product 8 Option 1": {
          "Deafult q": 8,
          "Price": getProductRef('srv_installation_charge_per_cam'),
          "Product 8 Option 1 ID": getProductRef('srv_installation_charge_per_cam'),
          "available": true,
          "max q": 8,
          "min q": 1,
          "rigid": false
        }
      }
    }
  }
};

async function seed() {
  try {
    await seedProducts();
    console.log('🌱 Seeding Installation service...');
    await db.collection('Services').doc('Installation').set(installationData);
    console.log('✅ Installation data seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
  process.exit();
}

seed();