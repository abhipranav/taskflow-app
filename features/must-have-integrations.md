# Must-Have Features: Integrations

## Document Information

| Feature Category | Integrations |
|------------------|--------------|
| Priority | Must-Have (MVP) |
| Target Release | v1.0 MVP |
| Integration Type | One-way (read-only) |
| Last Updated | 2026-01-29 |

## Overview

This document specifies the must-have integration features for TaskFlow's MVP. These features connect TaskFlow with external development tools, enabling users to link their tasks with GitHub/GitLab issues and pull requests.

**Integration Strategy**: Start with one-way read-only integrations to establish the foundation, with bi-directional sync planned for future releases.

## 1. GitHub/GitLab Link Integration

### 1.1 Description
Allow users to link TaskFlow cards with GitHub issues and pull requests, or GitLab issues and merge requests. Display previews of linked items with status and title information.

### 1.2 Requirements

#### Functional Requirements
- Add URL field in card modal under "Links" section
- Auto-detect GitHub/GitLab URLs when entered
- Fetch and display preview information (title, status, repository)
- Support both GitHub and GitLab platforms
- Open linked items in new browser tab

#### Supported URL Patterns
- GitHub Issues: `https://github.com/owner/repo/issues/number`
- GitHub Pull Requests: `https://github.com/owner/repo/pull/number`
- GitLab Issues: `https://gitlab.com/owner/repo/-/issues/number`
- GitLab Merge Requests: `https://gitlab.com/owner/repo/-/merge_requests/number`

#### Preview Information
- Issue/PR title
- Current status (open/closed/merged)
- Repository name
- Last updated timestamp
- Author information (if available)

#### User Interface Requirements
- "Links" section in card modal with add/remove functionality
- URL input field with validation
- Preview cards showing linked item details
- "Open in new tab" buttons for each link
- Visual indicators for different platforms (GitHub/GitLab icons)

### 1.3 User Stories
- As a developer, I want to link my tasks to GitHub issues so I can track progress
- As a user, I want to see the status of linked issues without leaving TaskFlow
- As a team member, I want to quickly access the original issue/PR from my task

### 1.4 Technical Implementation

#### MVP Implementation
- Server actions for URL fetching (Next.js)
- Simple HTTP requests to GitHub/GitLab APIs
- No authentication required (public repos only)
- Client-side URL pattern matching

#### API Integration
- GitHub REST API for issues and pull requests
- GitLab REST API for issues and merge requests
- Rate limiting handling
- Error handling for private/inaccessible repos

#### Data Storage
- Store URLs as simple text fields
- Cache preview data temporarily (optional)
- Support multiple links per card

#### Future Enhancements
- Bi-directional sync capabilities
- Webhook integration for real-time updates
- Private repository support with authentication
- Automated link creation from commits/branches

## 2. Acceptance Criteria

### 2.1 GitHub/GitLab Link Integration
- [ ] "Links" section appears in card modal
- [ ] URL input field accepts GitHub/GitLab URLs
- [ ] System detects and validates URL patterns
- [ ] Preview information displays correctly for public repos
- [ ] "Open in new tab" functionality works
- [ ] Multiple links can be added to a single card
- [ ] Links save and persist correctly

## 3. Implementation Notes

### 3.1 API Considerations
- Respect API rate limits (GitHub: 60 requests/hour for unauthenticated)
- Handle API errors gracefully (show fallback information)
- Cache responses to minimize API calls
- Support both public and private repositories (future)

### 3.2 Privacy and Security
- No sensitive data storage
- Client-side URL validation only
- Server-side API calls for security
- Clear error messages for inaccessible content

### 3.3 Platform Differences
- GitHub and GitLab have different API structures
- Handle platform-specific URL patterns
- Different status terminologies (PR vs MR, merged vs closed)

## 4. Dependencies

- Next.js 14+ App Router (server actions)
- GitHub REST API
- GitLab REST API
- Tailwind CSS + shadcn/ui for UI components
- Zustand for state management

## 5. Testing Considerations

- Test with various GitHub/GitLab URL formats
- Verify API responses for different repo types (public/private)
- Test error handling for invalid URLs
- Performance testing for multiple links per card
- Cross-browser testing for "open in new tab" functionality
- Mobile responsiveness for link previews