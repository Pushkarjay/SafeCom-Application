/**
 * Seed Script: Creates realistic nested installation bundles in Firestore
 * using existing catalog_product references.
 *
 * Usage: npx ts-node scripts/seed_installation_bundles.ts
 * Or: node --loader ts-node/esm scripts/seed_installation_bundles.ts
 *
 * This seeds Services/Installation with deeply nested product maps:
 *   Category → Setup → Product → Option → Sub → ... → Leaf
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// ─── Initialize Firebase ────────────────────────────────────
const keyPath = path.resolve(process.cwd(), 'backend_server/service-account-key.json');
if (!fs.existsSync(keyPath)) {
  console.error('❌ Service account key not found at', keyPath);
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
const app = initializeApp({ 
  credential: cert(serviceAccount),
  projectId: 'safecom-application-01'
});
const db = getFirestore(app, 'safecom-database-nosql');

// ─── Helper: create a leaf node ─────────────────────────────
function leaf(productId: string, defaultQty = 1, minQty = 1, maxQty = 1, rigid = false) {
  return {
    'Deafult q': defaultQty,
    'Price': db.doc(`catalog_product/${productId}`),
    [`${productId} ID`]: db.doc(`catalog_product/${productId}`),
    'available': true,
    'max q': maxQty,
    'min q': minQty,
    'rigid': rigid,
  };
}

// ─── Seed Data ──────────────────────────────────────────────
// Based on real catalog_product IDs from the database dump.
//
// Structure follows user's schema:
//   Product N → Product N Option M → Product N Option M sub K → ... → LEAF

async function seed() {
  const installationRef = db.collection('Services').doc('Installation');

  // ─────────────────────────────────────────────────────────
  // CATEGORY: IP Camera
  // ─────────────────────────────────────────────────────────
  const ipCamera = {
    // ── Setup: 4 Camera Setup ──
    '4 Camera Setup': {
      // Product 1: NVR — single option (no clubbing needed)
      'Product 1': {
        'Product 1 Option 1': leaf('PROD001', 1, 1, 1, true), // CP Plus 4Ch NVR
      },

      // Product 2: Camera — CLUBBED with nested depth
      // User picks 2MP vs 4MP, then Color vs B/W sub-options
      'Product 2': {
        'Product 2 Option 1': {
          // 2MP options
          'Product 2 Option 1 sub 1': leaf('PROD005', 4, 1, 8),   // 2MP Color Indoor
          'Product 2 Option 1 sub 2': leaf('PROD006', 4, 1, 8),   // 2MP Color Outdoor
        },
        'Product 2 Option 2': {
          // 4MP options
          'Product 2 Option 2 sub 1': leaf('PROD007', 4, 1, 8),   // 4MP Color Indoor
          'Product 2 Option 2 sub 2': leaf('PROD008', 4, 1, 8),   // 4MP Color Outdoor
        },
      },

      // Product 3: Hard Disk — CLUBBED (1TB vs 2TB vs 3TB)
      'Product 3': {
        'Product 3 Option 1': leaf('PROD037', 1, 1, 1),   // 1TB HDD
        'Product 3 Option 2': leaf('PROD038', 1, 1, 1),   // 2TB HDD
        'Product 3 Option 3': leaf('PROD039', 1, 1, 1),   // 3TB HDD
      },

      // Product 4: POE Switch — CLUBBED (HI-Focus vs CP Plus)
      'Product 4': {
        'Product 4 Option 1': leaf('PROD009', 1, 1, 1, true),   // HI-Focus 4Ch POE
        'Product 4 Option 2': leaf('PROD010', 1, 1, 1, true),   // CP Plus 4Ch POE
      },

      // Product 5: Cat6 Cable — single product
      'Product 5': {
        'Product 5 Option 1': leaf('PROD041', 1, 1, 3),   // Cat6 Cable Roll
      },

      // Product 6: Connectors — per camera
      'Product 6': {
        'Product 6 Option 1': leaf('PROD044', 4, 4, 16),  // Connectors per camera
      },

      // Product 7: Installation Charge
      'Product 7': {
        'Product 7 Option 1': leaf('srv_installation_charge_per_cam', 4, 4, 16, true),
      },
    },

    // ── Setup: 8 Camera Setup ──
    '8 Camera Setup': {
      'Product 1': {
        'Product 1 Option 1': leaf('PROD002', 1, 1, 1, true), // CP Plus 8Ch NVR
      },

      'Product 2': {
        'Product 2 Option 1': {
          'Product 2 Option 1 sub 1': leaf('PROD005', 8, 1, 16),
          'Product 2 Option 1 sub 2': leaf('PROD006', 8, 1, 16),
        },
        'Product 2 Option 2': {
          'Product 2 Option 2 sub 1': leaf('PROD007', 8, 1, 16),
          'Product 2 Option 2 sub 2': leaf('PROD008', 8, 1, 16),
        },
      },

      'Product 3': {
        'Product 3 Option 1': leaf('PROD037', 1, 1, 1),
        'Product 3 Option 2': leaf('PROD038', 1, 1, 2),
        'Product 3 Option 3': leaf('PROD039', 1, 1, 2),
      },

      'Product 4': {
        'Product 4 Option 1': leaf('PROD012', 1, 1, 1, true), // CP Plus 8Ch POE
      },

      'Product 5': {
        'Product 5 Option 1': leaf('PROD041', 2, 1, 4),
      },

      'Product 6': {
        'Product 6 Option 1': leaf('PROD044', 8, 8, 32),
      },

      'Product 7': {
        'Product 7 Option 1': leaf('srv_installation_charge_per_cam', 8, 8, 32, true),
      },
    },

    // ── Setup: 16 Camera Setup ──
    '16 Camera Setup': {
      'Product 1': {
        'Product 1 Option 1': leaf('PROD003', 1, 1, 1, true), // CP Plus 16Ch NVR
      },

      'Product 2': {
        'Product 2 Option 1': {
          'Product 2 Option 1 sub 1': leaf('PROD005', 16, 1, 32),
          'Product 2 Option 1 sub 2': leaf('PROD006', 16, 1, 32),
        },
        'Product 2 Option 2': {
          'Product 2 Option 2 sub 1': leaf('PROD007', 16, 1, 32),
          'Product 2 Option 2 sub 2': leaf('PROD008', 16, 1, 32),
        },
      },

      'Product 3': {
        'Product 3 Option 1': leaf('PROD038', 1, 1, 2),
        'Product 3 Option 2': leaf('PROD039', 1, 1, 2),
        'Product 3 Option 3': leaf('prod_hdd_4tb', 1, 1, 2),  // 4TB HDD
      },

      'Product 4': {
        'Product 4 Option 1': leaf('PROD041', 3, 2, 6),
      },

      'Product 5': {
        'Product 5 Option 1': leaf('PROD044', 16, 16, 64),
      },

      'Product 6': {
        'Product 6 Option 1': leaf('srv_installation_charge_per_cam', 16, 16, 64, true),
      },
    },
  };

  // ─────────────────────────────────────────────────────────
  // CATEGORY: DVR
  // ─────────────────────────────────────────────────────────
  const dvr = {
    '4 Camera Setup': {
      // Product 1: DVR — single
      'Product 1': {
        'Product 1 Option 1': leaf('PROD013', 1, 1, 1, true), // CP Plus 4Ch DVR
      },

      // Product 2: Camera — 4-level deep nesting!
      // Pick resolution → Pick color type → Pick indoor/outdoor → LEAF
      'Product 2': {
        'Product 2 Option 1': {
          // 2.4MP cameras
          'Product 2 Option 1 sub 1': {
            // B/W
            'Product 2 Option 1 sub 1 sub 1': leaf('PROD021', 4, 1, 8), // 2.4MP B/W Indoor
            'Product 2 Option 1 sub 1 sub 2': leaf('PROD022', 4, 1, 8), // 2.4MP B/W Outdoor
          },
          'Product 2 Option 1 sub 2': {
            // Color
            'Product 2 Option 1 sub 2 sub 1': leaf('PROD023', 4, 1, 8), // 2.4MP Color Indoor
            'Product 2 Option 1 sub 2 sub 2': leaf('PROD024', 4, 1, 8), // 2.4MP Color Outdoor
          },
        },
        'Product 2 Option 2': {
          // 5MP cameras
          'Product 2 Option 2 sub 1': leaf('PROD029', 4, 1, 8),  // 5MP B/W Indoor
          'Product 2 Option 2 sub 2': leaf('PROD030', 4, 1, 8),  // 5MP B/W Outdoor
          'Product 2 Option 2 sub 3': leaf('PROD031', 4, 1, 8),  // 5MP Color Indoor
          'Product 2 Option 2 sub 4': leaf('PROD032', 4, 1, 8),  // 5MP Color Outdoor
        },
      },

      // Product 3: Hard Disk
      'Product 3': {
        'Product 3 Option 1': leaf('PROD037', 1, 1, 1),
        'Product 3 Option 2': leaf('PROD038', 1, 1, 1),
        'Product 3 Option 3': leaf('PROD039', 1, 1, 1),
      },

      // Product 4: SMPS Power Supply
      'Product 4': {
        'Product 4 Option 1': leaf('PROD033', 1, 1, 1, true), // 5A SMPS
      },

      // Product 5: Coaxial Cable
      'Product 5': {
        'Product 5 Option 1': leaf('PROD040', 1, 1, 3),
      },

      // Product 6: Connectors
      'Product 6': {
        'Product 6 Option 1': leaf('PROD044', 4, 4, 16),
      },

      // Product 7: Installation Charge
      'Product 7': {
        'Product 7 Option 1': leaf('srv_installation_charge_per_cam', 4, 4, 16, true),
      },
    },

    '8 Camera Setup': {
      'Product 1': {
        'Product 1 Option 1': leaf('PROD014', 1, 1, 1, true), // CP Plus 8Ch DVR
      },

      'Product 2': {
        'Product 2 Option 1': {
          'Product 2 Option 1 sub 1': {
            'Product 2 Option 1 sub 1 sub 1': leaf('PROD021', 8, 1, 16),
            'Product 2 Option 1 sub 1 sub 2': leaf('PROD022', 8, 1, 16),
          },
          'Product 2 Option 1 sub 2': {
            'Product 2 Option 1 sub 2 sub 1': leaf('PROD025', 8, 1, 16), // 2.4MP Color Indoor w/ Audio
            'Product 2 Option 1 sub 2 sub 2': leaf('PROD026', 8, 1, 16), // 2.4MP Color Outdoor w/ Audio
          },
        },
        'Product 2 Option 2': {
          'Product 2 Option 2 sub 1': leaf('PROD029', 8, 1, 16),
          'Product 2 Option 2 sub 2': leaf('PROD030', 8, 1, 16),
          'Product 2 Option 2 sub 3': leaf('PROD031', 8, 1, 16),
          'Product 2 Option 2 sub 4': leaf('PROD032', 8, 1, 16),
        },
      },

      'Product 3': {
        'Product 3 Option 1': leaf('PROD037', 1, 1, 1),
        'Product 3 Option 2': leaf('PROD038', 1, 1, 2),
        'Product 3 Option 3': leaf('PROD039', 1, 1, 2),
      },

      'Product 4': {
        'Product 4 Option 1': leaf('PROD034', 1, 1, 1, true), // 10A SMPS
      },

      'Product 5': {
        'Product 5 Option 1': leaf('PROD040', 2, 1, 4),
      },

      'Product 6': {
        'Product 6 Option 1': leaf('PROD044', 8, 8, 32),
      },

      'Product 7': {
        'Product 7 Option 1': leaf('srv_installation_charge_per_cam', 8, 8, 32, true),
      },
    },
  };

  // ─── Write to Firestore ─────────────────────────────────
  console.log('🚀 Seeding installation bundles...');
  
  await installationRef.set({
    'IP Camera': ipCamera,
    'DVR': dvr,
  }, { merge: true });

  console.log('✅ Installation bundles seeded successfully!');
  console.log('   Categories: IP Camera, DVR');
  console.log('   IP Camera setups: 4, 8, 16 Camera');
  console.log('   DVR setups: 4, 8 Camera');
  console.log('   Includes 2-4 level deep nested clubbing');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
