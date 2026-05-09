# Architecture Gallery

## Visual Documentation Index

This gallery contains all visual exports of the SafeCom application architecture. Each section contains:
- **source/** - Editable source files (.mmd, .puml, .drawio)
- **images/** - Generated exports (SVG, PNG, PDF)
- **export/** - Compressed exports for distribution

---

## Section Index

### 1. High-Level Architecture
| Visual | Description | Format |
|--------|-------------|--------|
| System Overview | Complete platform architecture showing all components | Mermaid |
| Component Interaction | How apps communicate with backend and database | Mermaid |

**Source Files:**
- `high_level_architecture.mmd` - Main system diagram
- `component_interaction.mmd` - Component relationships

### 2. Component Diagrams
| Visual | Description | Format |
|--------|-------------|--------|
| Customer App Architecture | Layered architecture of customer mobile app | Mermaid |
| Employee App Architecture | Layered architecture of employee mobile app | Mermaid |
| Admin Web Architecture | React component structure | Mermaid |
| Backend Architecture | Express server with middleware and services | Mermaid |

### 3. Database Architecture
| Visual | Description | Format |
|--------|-------------|--------|
| Firestore Schema | Entity-relationship diagram showing collections | Mermaid (ER) |
| Collection Relationships | How collections reference each other | Mermaid |

### 4. API Flows
| Visual | Description | Format |
|--------|-------------|--------|
| API Lifecycle | Request flow through middleware pipeline | Mermaid |
| Booking Flow | Customer booking sequence | Sequence |
| Payment Flow | Payment processing with Razorpay | Sequence |

### 5. Mobile Navigation
| Visual | Description | Format |
|--------|-------------|--------|
| Customer App Routes | Navigation flow for customer app | Mermaid |
| Employee App Routes | Navigation flow for employee app | Mermaid |

### 6. State Management
| Visual | Description | Format |
|--------|-------------|--------|
| Provider Flow | State management architecture | Mermaid |
| Data Flow | How data propagates through the app | Mermaid |

### 7. Authentication
| Visual | Description | Format |
|--------|-------------|--------|
| Auth Flow | Complete authentication sequence | Sequence |
| RBAC Map | Role-based access control structure | Mermaid |

### 8. Microservices
| Visual | Description | Format |
|--------|-------------|--------|
| Service Split | Proposed microservices decomposition | Mermaid |
| Migration Path | How to migrate from monolith | Mermaid |

### 9. Event Flows
| Visual | Description | Format |
|--------|-------------|--------|
| Notification Flow | Push notification architecture | Mermaid |
| Event System | Event-driven architecture (future) | Mermaid |

---

## Master System Map

The **MASTER_SYSTEM_MAP.svg** in `/assets` provides a comprehensive overview of the entire platform:

- All 4 applications (Customer APK, Employee APK, Admin Web, Backend)
- Database collections and relationships
- External service integrations
- User flows and interactions
- API routes and middleware
- Service boundaries and domains

---

## Visual Quality Standards

All generated diagrams follow these standards:

### Typography
- **Headers**: System font, 18px bold
- **Labels**: System font, 14px regular
- **Code**: Monospace, 12px

### Color Palette
```
Primary:     #4285F4 (Blue)
Secondary:   #34A853 (Green)  
Accent:      #EA4335 (Red)
Warning:     #FBBC04 (Amber)
Background:  #FFFFFF / #1E1E1E (Light/Dark)
Text:        #0F172A / #E2E8F0 (Light/Dark)
```

### Export Formats
- **SVG**: Primary format, vector-quality, zoom-friendly
- **PNG**: High-resolution raster for presentations
- **PDF**: Vector quality for printing

---

## Generating Visuals

### Using Mermaid CLI

```bash
# Install Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# Generate all diagrams
cd Architecture/source
npx -y @mermaid-js/mermaid-cli -i "*.mmd" -o ../images -t dark --bgColor "#1E1E1E"

# Generate specific diagram
npx -y @mermaid-js/mermaid-cli -i high_level_architecture.mmd -o ../images -t dark
```

### Using Docker

```bash
docker run -v $(pwd):/data minlag/mermaid-cli \
    -i /data/source/high_level_architecture.mmd \
    -o /data/images/ \
    -t dark
```

---

## Contributing

When adding new diagrams:
1. Create source in `source/` folder
2. Use `.mmd` extension for Mermaid
3. Follow naming convention: `section_topic.mmd`
4. Add entry to this gallery index
5. Generate exports to `images/`

---

*Generated: 2026-05-09*
*For latest updates, check the source files in `/source`*