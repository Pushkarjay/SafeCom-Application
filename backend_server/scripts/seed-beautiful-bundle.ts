import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || 'safecom-application-01'
});
const db = getFirestore(app, process.env.FIRESTORE_DB_ID || 'safecom-database-nosql');

function makeRef(id: string) {
  return db.doc(`catalog_product/${id}`);
}

function makeOption(id: string, defaultQty: number, minQty: number, maxQty: number, rigid: boolean = false) {
  return {
    'Price': makeRef(id),
    [`${id} ID`]: makeRef(id),
    'available': true,
    'Deafult q': defaultQty,
    'min q': minQty,
    'max q': maxQty,
    'rigid': rigid
  };
}

async function run() {
  const serviceRef = db.collection('Services').doc('Installation');
  
  // We will completely replace "8 Camera Setup" under "IP Camera" with a beautiful nested bundle
  
  const setup = {
    "NVR Options": {
      "CP Plus 8 Channel HD NVR 1080 P": makeOption('PROD002', 1, 1, 1, true)
    },
    "Camera Selection": {
      "Indoor Cameras": {
        "2MP Resolution": {
          "CP Plus 2MP Color Indoor Camera": makeOption('PROD005', 4, 1, 8, false)
        },
        "4MP Resolution": {
          "CP Plus 4MP Color Indoor Camera": makeOption('PROD007', 4, 1, 8, false)
        }
      },
      "Outdoor Cameras": {
        "2MP Resolution": {
          "CP Plus 2MP Color Outdoor Camera": makeOption('PROD006', 4, 1, 8, false)
        },
        "4MP Resolution": {
          "CP Plus 4MP Color Outdoor Camera": makeOption('PROD008', 4, 1, 8, false)
        }
      }
    },
    "Storage Options": {
      "1TB Hard Disk": makeOption('PROD037', 1, 1, 1, false),
      "2TB Hard Disk": makeOption('PROD038', 1, 1, 2, false),
      "3TB Hard Disk": makeOption('PROD039', 1, 1, 2, false)
    },
    "Networking": {
      "CP Plus 8Ch - POE Switch": makeOption('PROD012', 1, 1, 2, false)
    },
    "Wiring & Connectors": {
      "Cat6 Cable (Economy)": makeOption('PROD041', 2, 1, 4, false),
      "Connectors Per Camera": makeOption('PROD044', 8, 8, 32, false)
    },
    "Installation & Services": {
      "Site Visit Charge": makeOption('PROD066', 1, 1, 1, true),
      "Per Camera Installation": makeOption('PROD076', 8, 8, 8, true)
    }
  };

  await serviceRef.update({
    "IP Camera.8 Camera Setup": setup
  });
  
  console.log("Successfully seeded realistic nested bundle into 'IP Camera -> 8 Camera Setup'!");
}

run().catch(console.error);
