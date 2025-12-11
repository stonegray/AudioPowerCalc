# Audio System Power Calculator - Design Guidelines

## Design Approach: Professional Dashboard System

**Selected System**: Material Design 3 / Carbon Design System hybrid approach
**Rationale**: Technical calculation tool requiring dense information display, clear visual hierarchy, and professional aesthetics for audio engineering professionals.

**Core Principles**:
- Clarity over decoration - every pixel serves a functional purpose
- Information density without clutter
- Professional, technical aesthetic
- Scannable data hierarchies

---

## Typography System

**Font Stack**: 
- Primary: Inter or Roboto (system UI optimization)
- Monospace: JetBrains Mono or SF Mono (technical values, calculations)

**Hierarchy**:
- Page Title: 2xl font, semibold weight
- Section Headers (Generator/Amp/Speaker cards): lg font, medium weight
- Field Labels: sm font, medium weight, uppercase tracking
- Input Values: base font, normal weight
- Technical Outputs (watts, ohms, SPL): base font, monospace, medium weight
- Calculation Breakdowns: sm font, monospace, normal weight
- Helper Text: xs font, normal weight

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 3, 4, 6, 8
- Component padding: p-4 to p-6
- Inter-element spacing: gap-3 or gap-4
- Section margins: mb-6 or mb-8
- Tight groupings: gap-2

**Grid Structure**:
- Three-column layout: `grid grid-cols-3 gap-6`
- Responsive: Stack to single column on mobile/tablet (md:grid-cols-1 lg:grid-cols-3)
- Each column has consistent max-width containers
- Global settings: Full-width panel above three columns

---

## Component Library

### Global Settings Panel
- Full-width horizontal panel at top
- Grid layout for settings groups: `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4`
- Includes: Genre selector, Temperature, Altitude, Units toggle, SPL distance, Array factor, Save/Load buttons, Find Problems button
- Compact height with clear visual separation from main workspace

### Equipment Cards (Generators/Amps/Speakers)
**Structure**:
- Bordered containers with subtle elevation
- Header section with equipment name/type dropdown
- Status display at top (utilization %, watts, etc.) - prominent, monospace typography
- Collapsible calculation breakdown panel (chevron icon toggle)
- Configuration fields in 2-column grid for density
- Connection nodes positioned on left/right edges (absolute positioning)

**Form Fields**:
- Labels above inputs (vertical stacking)
- Input groups: Combine related fields (e.g., "AWG + Length" or "Manual Resistance" toggle)
- Dropdowns: Full-width within grid cells
- Number inputs: Right-aligned text for easier scanning
- Checkboxes/toggles: Inline with labels

### Connection Nodes & Lines
- **Nodes**: Circular indicators (12px diameter), positioned absolutely on card edges
  - Generator distro outputs: Right edge
  - Amplifier inputs: Left edge
  - Amplifier channel outputs: Right edge  
  - Speaker inputs: Left edge
- **Lines**: SVG curved Bezier paths drawn between nodes
  - Stroke width: 2px
  - Distinct colors per connection (maintain color consistency per circuit)
  - Hover state: Increase stroke width to 3px
  - Active/selected: Glow effect or dashed animation

### Collapsible Panels
- Header with chevron icon (rotate on expand)
- Smooth height transition
- Content: Indented list format with monospace values aligned right
- Nested structure for per-channel breakdowns

### Channel Configuration (Amplifiers)
- 1-8 channel rows in vertical stack
- Each row: Channel number, Enable toggle, Bridge toggle (even channels), HPF/LPF inputs, Load display (Ω)
- Bridge state: Gray out paired channel with visual connection indicator
- Compact spacing (gap-2) for scanability

### Add Buttons
- Large, centered placeholders in empty columns
- Dashed border treatment suggesting "add here"
- Icon + text label
- Multiple button options in column 2 (Amp/Powered Speaker/Other) - vertical stack with gap-2

### Status Indicators
- Utilization percentages: Progress bar visualization
- Over-capacity warnings: Bold text with warning icon (Find Problems feature)
- Real-time calculation values: Update without page refresh

---

## Information Architecture

**Column 1 - Power Sources**:
- Generator type selector at top
- Distribution channels listed below
- Connection nodes on right edge

**Column 2 - Amplification**:
- Amplifier cards
- Powered speaker cards  
- Other equipment cards
- Input nodes on left, output nodes on right

**Column 3 - Speakers**:
- Passive speaker cards
- Quantity selector prominent
- Input nodes on left edge
- SPL output display at top

**Visual Flow**: Left-to-right signal flow matches electrical flow (generator → amp → speaker)

---

## Interaction Patterns

**Connection Creation**:
- Click source node → line follows cursor → click destination node
- Color assigned upon connection completion
- Click existing line to delete connection

**Form Behavior**:
- Real-time validation on technical inputs
- Conditional field display (e.g., Custom model shows additional fields)
- Disabled state for bridged amp channels

**Calculations**:
- Auto-update on any input change
- Smooth number transitions for changing values
- Collapsible sections default to collapsed, expand on user action

---

## Responsive Behavior

- Desktop (lg+): Three-column layout as designed
- Tablet (md): Single column, cards stack vertically, maintain connection lines
- Mobile: Single column, simplified connection UI (list-based assignment vs visual lines)

---

## Accessibility

- All form inputs with proper labels
- Keyboard navigation for connection creation (tab through nodes, enter to connect)
- ARIA labels for technical abbreviations (e.g., "HPF: High-Pass Filter")
- Sufficient contrast for monospace calculation values
- Focus indicators on all interactive elements