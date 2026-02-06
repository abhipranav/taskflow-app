# Must-Have Features: Workflow

## Document Information

| Feature Category | Workflow |
|------------------|----------|
| Priority | Must-Have (MVP) |
| Target Release | v1.0 MVP |
| User Type | Single-user (GitHub auth) |
| Last Updated | 2026-01-29 |

## Overview

This document specifies the must-have workflow features for TaskFlow's MVP. These features enable users to organize, categorize, and assign tasks effectively within the Kanban board system.

## 1. Custom Columns

### 1.1 Description
Flexible column system that allows users to create custom workflow stages beyond the default Kanban columns (To Do, In Progress, Done).

### 1.2 Requirements

#### Functional Requirements
- Create new columns with custom names
- Reorder columns via drag-and-drop
- Delete columns (with confirmation for safety)
- Rename existing columns
- Maintain column order across sessions

#### User Interface Requirements
- Column headers with edit-in-place functionality
- Add column button (+) at board edge
- Drag handles for reordering
- Delete confirmation dialog
- Visual feedback during drag operations

#### Data Requirements
- Store column definitions in database
- Preserve task positions when columns are reordered
- Handle column deletion gracefully (move tasks to adjacent column)

### 1.3 User Stories
- As a user, I want to create columns that match my workflow (e.g., "Backlog", "Ready", "In Review")
- As a user, I want to reorder columns to match my process flow
- As a user, I want to rename columns as my workflow evolves

### 1.4 Technical Implementation
- Extend existing Kanban board component
- Use @dnd-kit for column reordering
- Database schema for board columns
- Zustand state management for column operations

## 2. Labels

### 2.1 Description
Colored label system for categorizing and organizing tasks, allowing users to tag tasks with multiple labels for flexible organization.

### 2.2 Requirements

#### Functional Requirements
- Create custom labels with names and colors
- Assign multiple labels to each task
- Remove labels from tasks
- Filter tasks by one or more labels
- Manage labels in board settings

#### Label Management
- Add new labels with color picker
- Edit existing label names and colors
- Delete unused labels
- Prevent deletion of labels currently in use

#### User Interface Requirements
- Label picker in card modal with color-coded badges
- Label management interface in board settings
- Filter dropdown with label checkboxes
- Visual label indicators on cards (compact view)

#### Data Requirements
- Store labels per board (not global)
- Many-to-many relationship between tasks and labels
- Color storage as hex codes

### 2.3 User Stories
- As a user, I want to categorize tasks with colored labels (e.g., "Bug", "Feature", "Urgent")
- As a user, I want to filter my board to see only tasks with specific labels
- As a user, I want to create custom labels that match my team's conventions

### 2.4 Technical Implementation
- shadcn/ui Badge components for label display
- Color picker component for label creation
- Database tables for labels and task-label relationships
- Filter logic in board and list views

## 3. Assignees

### 3.1 Description
Task assignment system for tracking responsibility. MVP supports single-user workflows with self-assignment and text-based assignee fields.

### 3.2 Requirements

#### Functional Requirements
- Assign tasks to the logged-in user automatically
- Manual assignment via text field (for future multi-user)
- Display assignee information on cards
- Filter tasks by assignee

#### MVP Implementation (Single-user)
- Auto-assign new tasks to current user
- Text field for custom assignee names
- Display assignee as avatar/initials or text

#### Future Implementation (Multi-user)
- User search and selection
- Avatar display from GitHub profiles
- Assignment notifications (future feature)

#### User Interface Requirements
- Assignee field in card modal
- Avatar/initials display on cards
- Assignee filter in search/filter panel
- Clear visual indication of assignment status

#### Data Requirements
- Store assignee as user ID or text string
- Support migration from text to user IDs
- Handle unassigned tasks gracefully

### 3.3 User Stories
- As a user, I want to see who is responsible for each task
- As a user, I want to assign tasks to myself or team members
- As a user, I want to filter tasks by assignee to see my workload

### 3.4 Technical Implementation
- shadcn/ui Avatar component for display
- NextAuth integration for current user
- Database field for assignee information
- Filter logic for assignee-based queries

## 4. Acceptance Criteria

### 4.1 Custom Columns
- [ ] Users can add new columns with custom names
- [ ] Columns can be reordered via drag-and-drop
- [ ] Columns can be renamed in-place
- [ ] Deleting a column moves tasks to adjacent column
- [ ] Column order persists across sessions

### 4.2 Labels
- [ ] Labels can be created with custom names and colors
- [ ] Multiple labels can be assigned to tasks
- [ ] Labels appear as colored badges on cards
- [ ] Tasks can be filtered by selected labels
- [ ] Unused labels can be deleted

### 4.3 Assignees
- [ ] New tasks are auto-assigned to current user
- [ ] Assignee field accepts text input
- [ ] Assignee information displays on cards
- [ ] Tasks can be filtered by assignee
- [ ] Assignee data saves correctly

## 5. Dependencies

- Next.js 14+ App Router
- Drizzle ORM + SQLite for data persistence
- @dnd-kit for drag-and-drop operations
- shadcn/ui components (Badge, Avatar, Dialog)
- Zustand for state management
- NextAuth for user authentication

## 6. Testing Considerations

- Test column reordering with tasks in each column
- Verify label filtering works across board and list views
- Test assignee assignment and filtering
- Ensure data integrity when columns/labels are deleted
- Performance testing with many columns and labels
- Mobile responsiveness for workflow features