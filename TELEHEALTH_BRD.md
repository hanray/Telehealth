# Business Requirements Document (BRD)
## Telehealth Platform - henrydjorgee.com

**Document Version:** 1.0  
**Date:** December 7, 2025  
**Prepared For:** Client Requirements & Development Team  
**Project:** Telehealth Web Application

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 7, 2025 | Development Team | Initial BRD based on existing application analysis |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Business Objectives](#3-business-objectives)
4. [Stakeholders](#4-stakeholders)
5. [System Architecture](#5-system-architecture)
6. [User Roles & Permissions](#6-user-roles--permissions)
7. [Functional Requirements](#7-functional-requirements)
   - 7.1 [Patient Portal](#71-patient-portal)
   - 7.2 [Doctor Dashboard](#72-doctor-dashboard)
   - 7.3 [Nurse Dashboard](#73-nurse-dashboard)
   - 7.4 [Admin Portal](#74-admin-portal)
8. [Data Models & Schemas](#8-data-models--schemas)
9. [API Specifications](#9-api-specifications)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Security & Compliance](#11-security--compliance)
12. [Integration Points & Dependencies](#12-integration-points--dependencies)
13. [Assumptions, Constraints & Risks](#13-assumptions-constraints--risks)
14. [Future Enhancements](#14-future-enhancements)

---

## 1. Executive Summary

### 1.1 Purpose
This Business Requirements Document (BRD) defines the comprehensive requirements for a telehealth web application designed to facilitate remote healthcare delivery between patients and healthcare providers. The system enables secure messaging, appointment scheduling, prescription management, and medical record access through role-based dashboards.

### 1.2 Scope
The telehealth platform serves four primary user groups:
- **Patients**: Access healthcare services, book appointments, manage prescriptions, and communicate with providers
- **Doctors**: Manage patient care, appointments, prescriptions, and medical records
- **Nurses**: Handle patient vitals, medication administration, and clinical support
- **Administrators**: Configure system settings, manage users, and monitor platform health

### 1.3 Key Features
- **Secure Messaging System**: Real-time communication between patients and healthcare providers with priority levels and read receipts
- **Appointment Management**: Scheduling, tracking, and managing appointments across multiple types (telehealth, in-person, follow-up)
- **Prescription Management**: Digital prescription creation, refill requests, and tracking
- **Medical Records**: Electronic health records access with lab results, vitals tracking, and patient history
- **Multi-Dashboard Interface**: Role-specific interfaces optimized for each user type
- **System Administration**: Configurable settings, feature flags, and user management

---

## 2. Project Overview

### 2.1 Technology Stack

#### Frontend
- **Framework**: React 19.1.1
- **UI Library**: React-Bootstrap 
- **Styling**: Bootstrap 5 with custom CSS
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Build Tool**: Create React App with production optimization
- **Deployment**: Static files served via CloudLinux Passenger

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB Atlas (Cloud-hosted)
- **ODM**: Mongoose 7.5.0
- **Authentication**: JWT (jsonwebtoken 9.0.2, bcryptjs 2.4.3)
- **Real-time**: Socket.IO 4.5.2 (configured, not yet implemented)
- **Process Manager**: CloudLinux Passenger

#### Infrastructure
- **Hosting**: CloudLinux shared hosting environment
- **Web Server**: Passenger app server
- **Database**: MongoDB Atlas (cloud cluster)
- **DNS/Domain**: henrydjorgee.com
- **SSL**: HTTPS enabled

### 2.2 Deployment Architecture
```
Client Browser
      ↓
HTTPS (henrydjorgee.com)
      ↓
CloudLinux Passenger → Static React App (index.html)
      ↓
Express.js API Server (:5000)
      ↓
MongoDB Atlas (Cloud)

NOTE: THIS ARCHITECTURE IS BASIC. A software archtitech needs to look at real business systems and determine how the app can communicate with these 3rd parties the real deployment architecture could look drastically different with different business rules to accomodate.
```

### 2.3 Current Implementation Status

**Fully Implemented:**
- ✅ React frontend with 4 dashboards (Doctor, Nurse, Patient, Admin)
- ✅ Express.js backend server with MongoDB connection
- ✅ Secure messaging API endpoints
- ✅ Message data model with full schema
- ✅ CORS configuration for cross-origin requests
- ✅ Database connection pooling and auto-reconnection
- ✅ Health monitoring endpoint
- ✅ Graceful shutdown handling
- ✅ Frontend mock data system for development
- ✅ Feature flag system for controlled rollout

**Partially Implemented:**
- ⚠️ Authentication (JWT configured, routes empty)
- ⚠️ User management (dependencies installed, no implementation)
- ⚠️ Appointment system (referenced in messages, no dedicated API)
- ⚠️ Prescription system (frontend only, no backend)

**Planned but Not Started:**
- ❌ Socket.IO real-time messaging
- ❌ Email notifications
- ❌ SMS notifications (Twilio)
- ❌ File upload for attachments
- ❌ Video consultation integration
- ❌ Payment processing

---

## 3. Business Objectives

### 3.1 Primary Objectives
1. **Improve Healthcare Accessibility**: Enable patients to access healthcare services remotely, reducing barriers to care
2. **Streamline Provider Workflows**: Provide efficient tools for doctors and nurses to manage patient care
3. **Enhance Patient Engagement**: Facilitate continuous communication between patients and providers
4. **Ensure Data Security**: Maintain HIPAA-compliant handling of Protected Health Information (PHI)
5. **Support Multiple Care Models**: Enable both synchronous (real-time) and asynchronous (messaging) care delivery

### 3.2 Success Metrics
- Patient appointment booking rate
- Provider response time to messages
- Prescription fulfillment time
- System uptime and availability
- User satisfaction scores
- Reduction in no-show appointments

---

## 4. Stakeholders

### 4.1 Primary Stakeholders

| Role | Responsibilities | Key Needs |
|------|-----------------|-----------|
| **Patients** | Use platform for healthcare access | Easy appointment booking, secure messaging, prescription management |
| **Doctors** | Provide medical care and prescriptions | Efficient patient management, clinical decision support, prescription tools |
| **Nurses** | Clinical support and patient monitoring | Vitals tracking, medication administration, shift reporting |
| **Administrators** | System configuration and user management | System monitoring, user management, configuration control |

### 4.2 Secondary Stakeholders
- **Healthcare Organization Management**: Oversight and compliance
- **IT Support Team**: Technical maintenance and troubleshooting
- **Compliance Officers**: HIPAA and regulatory compliance
- **Billing Department**: Insurance and payment processing (future)

---

## 5. System Architecture

### 5.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Patient  │  │  Doctor  │  │  Nurse   │  │  Admin   │   │
│  │ Portal   │  │Dashboard │  │Dashboard │  │  Portal  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                     React SPA (Static Files)                │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Express.js REST API Server                 │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │     │
│  │  │ Messages │  │   Auth   │  │  Users   │        │     │
│  │  │  Routes  │  │  Routes  │  │  Routes  │        │     │
│  │  └──────────┘  └──────────┘  └──────────┘        │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │     │
│  │  │Appoint-  │  │  Health  │  │   CORS   │        │     │
│  │  │  ments   │  │  Check   │  │Middleware│        │     │
│  │  └──────────┘  └──────────┘  └──────────┘        │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓ TCP
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │         MongoDB Atlas (Cloud Database)             │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │     │
│  │  │ Messages │  │  Users   │  │Appoint-  │        │     │
│  │  │Collection│  │Collection│  │  ments   │        │     │
│  │  └──────────┘  └──────────┘  └──────────┘        │     │
│  │  ┌──────────┐  ┌──────────┐                       │     │
│  │  │Prescrip- │  │   Labs   │                       │     │
│  │  │  tions   │  │  Results │                       │     │
│  │  └──────────┘  └──────────┘                       │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Component Interactions

#### Message Flow Example
```
Patient sends message → 
  Frontend POST /api/messages/send → 
    Express validates → 
      Mongoose saves to MongoDB → 
        Auto-response triggered (if patient) → 
          New message saved → 
            Response returned
```

### 5.3 Database Connection Management
- **Connection Pooling**: Min 2, Max 10 concurrent connections
- **Auto-Reconnection**: 5 retry attempts with exponential backoff
- **Health Monitoring**: Periodic state checks every 30 seconds (development)
- **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT

---

## 6. User Roles & Permissions

### 6.1 Role Definitions

#### 6.1.1 Patient Role
**Access Level**: Restricted to own data  
**Primary Functions**:
- View and book appointments
- Send/receive messages to/from providers
- View own medical records
- Request prescription refills
- Update personal information
- View test results

**Restrictions**:
- Cannot access other patients' data
- Cannot modify medical records
- Cannot prescribe medications
- Cannot access system administration

#### 6.1.2 Doctor Role
**Access Level**: Access to assigned patients  
**Primary Functions**:
- View all assigned patient records
- Prescribe medications
- Create/modify appointment schedules
- Send/receive messages from patients
- Upload test results
- Write consultation notes
- Auto-response to patient messages
- Edit patient chief complaints

**Permissions**:
- `canPrescribe`: true
- `canEditComplaints`: true
- `canAccessMedicalRecords`: true

#### 6.1.3 Nurse Role
**Access Level**: Department-based access  
**Primary Functions**:
- Record patient vitals
- Administer medications
- View assigned patient information
- Send/receive messages
- Generate shift reports
- Triage patients
- Coordinate with doctors

**Permissions**:
- `canRecordVitals`: true
- `canAdministerMeds`: true
- `canTriage`: true
- `canPrescribe`: false

#### 6.1.4 Admin Role
**Access Level**: System-wide  
**Primary Functions**:
- Create/edit/deactivate users
- Assign user roles
- Configure system settings
- Manage feature flags
- View system health metrics
- Broadcast system messages
- Manage appointment types
- View all system data

**Permissions**: Full system access

### 6.2 Permission Matrix

| Feature | Patient | Doctor | Nurse | Admin |
|---------|---------|--------|-------|-------|
| View Own Medical Record | ✅ | ✅ | ✅ | ✅ |
| View Other Patient Records | ❌ | ✅ | ✅ (assigned) | ✅ |
| Prescribe Medications | ❌ | ✅ | ❌ | ✅ |
| Record Vitals | ❌ | ✅ | ✅ | ✅ |
| Book Appointments | ✅ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| Configure System | ❌ | ❌ | ❌ | ✅ |
| Send Messages | ✅ | ✅ | ✅ | ✅ |
| Upload Lab Results | ❌ | ✅ | ❌ | ✅ |
| Administer Medications | ❌ | ✅ | ✅ | ✅ |
| Edit Chief Complaints | ❌ | ✅ | ❌ | ✅ |
| Generate Reports | ❌ | ✅ | ✅ | ✅ |

---

## 7. Business Rules - Functional Requirements

### 7.1 Patient Portal

**Business Goal**: Enable patients to independently manage their healthcare journey through self-service appointment booking, prescription management, secure provider communication, and access to personal medical information.

#### Appointment Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-P-001 | Patients must be able to view all their appointments in a tabular format showing date/time, type, status, and chief complaint |
| BR-P-002 | The system must display appointment status using color coding: confirmed (green), pending (yellow), cancelled (red), scheduled (blue), in-progress (yellow) |
| BR-P-003 | By default, only non-completed appointments shall be displayed to patients |
| BR-P-004 | Patients must be able to book new appointments by providing appointment type, preferred date, and preferred time (all required fields) |
| BR-P-005 | Available time slots for appointments are: 9:00 AM, 10:00 AM, 11:00 AM, 2:00 PM, 3:00 PM, 4:00 PM |
| BR-P-006 | New patient appointments must be created with "pending" status until confirmed by staff |
| BR-P-007 | Patients can join telehealth appointments via video call only if the appointment type is "Telehealth" and the enableTelehealth feature flag is active |
| BR-P-008 | Join Call button shall only appear for confirmed appointments |
| BR-P-009 | Patients must be able to request rescheduling for any non-completed appointment |
| BR-P-010 | When an appointment is rescheduled, its status must change to "pending" for staff review |

#### Prescription Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-P-011 | Patients must be able to view all active prescriptions showing medication name, dosage, and refills remaining |
| BR-P-012 | Active prescriptions shall be displayed with green status badges |
| BR-P-013 | Patients can request prescription refills only when refills remaining is greater than 0 |
| BR-P-014 | When no refills remain, the system must display: "No refills remaining. You will need to contact your doctor for a new prescription." |
| BR-P-015 | Upon successful refill request, the system must display: "Refill request submitted successfully! You will receive a notification when ready for pickup." |
| BR-P-016 | Refill count must decrement after each successful refill request |
| BR-P-017 | The refill button must be disabled when refills remaining equals 0 |
| BR-P-018 | Prescription details must include: medication name, dosage, quantity, refills remaining, prescribing doctor, date prescribed, and full instructions |
| BR-P-019 | Prescription status must be one of: active, pending, ready, collected, expired, or completed |

#### Secure Messaging Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-P-020 | Patients must be able to view their 3 most recent messages on the dashboard |
| BR-P-021 | Unread messages must be visually distinguished with blue border and primary color highlighting |
| BR-P-022 | Message Provider functionality shall only be available when the enableChat feature flag is true |
| BR-P-023 | Patients must be able to send messages to healthcare providers through a secure messaging interface |
| BR-P-024 | All messages must include sender information, subject, message content, and timestamp |

#### Medical Records Access Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-P-025 | Patients can access medical records only when the enableMedicalRecords feature flag is true |
| BR-P-026 | Medical records must include: demographics, vital signs, lab results, allergies, medications, and visit history |
| BR-P-027 | All medical record access must be read-only for patients |
| BR-P-028 | Test results section must display "No recent test results" message when no results are available |
| BR-P-029 | Pending test results count must be displayed in dashboard metrics |

#### Insurance Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-P-030 | Patients must be able to view insurance information including provider name, policy number, member ID, group number, effective date, expiration date, and plan type |
| BR-P-031 | Plan types available are: Basic, Silver, Gold, Gold Plus, Platinum |
| BR-P-032 | Insurance information must display copay amounts for: Primary Care, Specialist, and Emergency visits |
| BR-P-033 | Deductible and Out-of-Pocket Maximum values must be displayed |
| BR-P-034 | Patients can update insurance information with required fields: Provider, Policy Number, and Member ID |
| BR-P-035 | Insurance updates must require validation before saving |

#### Profile & Dashboard Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-P-036 | Patient dashboard must display personalized greeting with patient name |
| BR-P-037 | Dashboard metrics must show: upcoming appointments count, active prescriptions count, pending test results count, and unread messages count |
| BR-P-038 | System-wide broadcast messages from admin must be displayed when configured |
| BR-P-039 | Patient profile must display: name, ID, date of birth, blood type, phone, email, address, emergency contact, and allergies |
| BR-P-040 | Quick Actions panel must provide access to: book appointment, message provider (if enabled), request refill, view medical records (if enabled), and update insurance

---

### 7.2 Doctor Dashboard

**Business Goal**: Empower doctors to efficiently manage patient care through streamlined appointment management, prescription writing, lab review, and secure communication tools that support clinical decision-making.

#### Appointment Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-D-001 | Doctors must be able to view today's appointments in tabular format showing time, patient, type, status, chief complaint, and actions |
| BR-D-002 | Appointment status must be displayed with color-coded badges: confirmed, pending, in-progress, completed, cancelled |
| BR-D-003 | Priority indicators must show appointment urgency levels: normal, high, urgent |
| BR-D-004 | Doctors must be able to schedule new appointments with required fields: Patient Name, Date, Time, Appointment Type, and Priority |
| BR-D-005 | Patient ID shall auto-generate using format "P" + timestamp if not provided |
| BR-D-006 | New appointments scheduled by doctors must automatically have status set to "scheduled" |
| BR-D-007 | Doctors must be able to start consultations which changes appointment status to "in-progress" |
| BR-D-008 | For in-progress appointments, doctors shall see "Continue" button instead of "Start" button |
| BR-D-009 | Doctors can initiate video consultations for Telehealth appointment types |
| BR-D-010 | Video call button must open the video platform in a new window and integrate with the appointment record |

#### Patient Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-D-011 | Doctors must be able to view all assigned patients showing name, age, last visit, condition, status, and available actions |
| BR-D-012 | Patients with recent hospitalizations must display "ADMITTED" badge |
| BR-D-013 | Recent patients list shall display in sidebar showing name, age, last visit, condition, and admission status |
| BR-D-014 | Doctors must have access to patient management modal with search, filter, and bulk action capabilities |
| BR-D-015 | Doctors can access patient medical records only when enableMedicalRecords feature flag is true |
| BR-D-016 | Patient medical records must include: demographics, vitals, lab results, medications, allergies, and visit history |
| BR-D-017 | Patient details modal must show: age, sex, DOB, blood type, phone, email, address, allergies, current condition, chief complaint, recent hospitalizations, and lab results |

#### Prescription Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-D-018 | Prescribe button shall only be visible to doctors with canPrescribe permission |
| BR-D-019 | Prescription writing interface must include fields for: medication, dosage, frequency, and instructions |
| BR-D-020 | System must auto-populate patient information when writing prescriptions |
| BR-D-021 | The system must display info message: "This prescription will be sent to the pharmacy and patient automatically" |
| BR-D-022 | All prescriptions must save to patient record with timestamp |

#### Lab Results Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-D-023 | Dashboard must display count of pending lab results requiring doctor review |
| BR-D-024 | Review Pending Labs button must show current count of unreviewed results |
| BR-D-025 | Lab review interface must show: patient name, test type, date, and results summary |
| BR-D-026 | Critical lab results must be highlighted for immediate attention |
| BR-D-027 | Doctors must be able to mark lab results as reviewed |
| BR-D-028 | Lab results in patient records must show review status with badges: PENDING REVIEW, REVIEWED, or CRITICAL - PENDING REVIEW |
| BR-D-029 | Critical pending labs must be highlighted in red with danger badge |

#### Documentation Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-D-030 | Doctors must be able to write consultation notes including observations, diagnosis, and treatment plan |
| BR-D-031 | Consultation notes must auto-save to patient record with timestamps |
| BR-D-032 | All consultation notes must be associated with the specific appointment |
| BR-D-033 | Doctors with canEditComplaints permission can modify patient chief complaints |
| BR-D-034 | Chief complaint edits must save with timestamp to appointment record |

#### Messaging & Communication Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-D-035 | Dashboard must display unread message counter |
| BR-D-036 | Message list must show patient name, subject, preview, date, and priority indicators |
| BR-D-037 | Unread messages must be visually highlighted |
| BR-D-038 | System must auto-respond to patient messages after 2 second delay |
| BR-D-039 | Auto-responses must be context-aware based on keywords: appointment, prescription, pain, urgent, test, refill |
| BR-D-040 | Auto-response system must generate appropriate responses for each keyword category |
| BR-D-041 | Generic professional response must be sent when no keywords match |
| BR-D-042 | Doctors can send messages to patients only when enableChat feature flag is true |
| BR-D-043 | All sent messages must save to conversation history |

#### Dashboard & UI Rules

**FR-D-001: View Today's Appointments**
- **Description**: Doctor can view appointments scheduled for current day
- **User Story**: As a doctor, I want to see my appointments for today
- **Acceptance Criteria**:
  - Tabular display with columns: Time, Patient, Type, Status, Chief Complaint, Actions
  - Show patient name, age, assigned doctor
  - Color-coded status badges (confirmed, pending, in-progress, completed, cancelled)
  - Priority indicators (normal, high, urgent)
  - Filterable and sortable
  - Real-time status updates

**FR-D-002: Schedule New Appointment**
- **Description**: Doctor can schedule appointments for patients
- **User Story**: As a doctor, I want to schedule appointments for my patients
- **Acceptance Criteria**:
  - Modal form with fields: Patient Name*, Patient Email, Patient Phone, Patient ID
  - Date*, Time*, Appointment Type*, Priority (normal/high/urgent)
  - Chief Complaint text area
  - Patient ID auto-generated if empty (format: P + timestamp)
  - Type populated from system configuration
  - Status automatically set to "scheduled"
  - Confirmation upon successful creation

**FR-D-003: Start/Continue Consultation**
- **Description**: Doctor can initiate or continue patient consultations
- **User Story**: As a doctor, I want to start seeing a patient for their appointment
- **Acceptance Criteria**:
  - "Start" button for confirmed/scheduled appointments
  - "Continue" button for in-progress appointments
  - Button text changes based on appointment status
  - Updates appointment status to "in-progress" on start
  - Opens consultation interface/notes

**FR-D-004: View Patient Medical Records**
- **Description**: Doctor can access complete patient medical records during appointments
- **User Story**: As a doctor, I want to review patient history before and during consultations
- **Acceptance Criteria**:
  - "Records" button available if `enableMedicalRecords` feature enabled
  - Opens comprehensive medical record view
  - Shows: Demographics, Vitals, Lab results, Medications, Allergies, Visit history
  - Tabs/accordion for organized information
  - Includes active alerts (e.g., recent hospitalizations)

**FR-D-005: View Patient Details**
- **Description**: Doctor can view detailed patient information
- **User Story**: As a doctor, I want to see complete patient demographics and clinical data
- **Acceptance Criteria**:
  - "Details" button opens patient details modal
  - Shows: Age, Sex, DOB, Blood Type, Phone, Email, Address
  - Allergies list
  - Current condition and chief complaint
  - Recent hospitalizations (if any) with ADMITTED badge
  - Lab results with review status
  - Recent visits history

**FR-D-006: Write Prescription**
- **Description**: Doctor can prescribe medications for patients
- **User Story**: As a doctor, I want to write prescriptions for my patients
- **Acceptance Criteria**:
  - "Prescribe" button visible if doctor has `canPrescribe` permission
  - Opens prescription writing modal
  - Text area for: Medication, Dosage, Frequency, Instructions
  - Auto-populates patient information
  - Info alert: "This prescription will be sent to the pharmacy and patient automatically"
  - Saves to patient record
  - Sends confirmation

#### 7.2.4 Patient Management

**FR-D-007: View Assigned Patients List**
- **Description**: Doctor can view all patients assigned to them
- **User Story**: As a doctor, I want to see my patient panel
- **Acceptance Criteria**:
  - Tabular view: Patient Name, Age, Last Visit, Condition, Status, Actions
  - Shows current admission status (ADMITTED badge if recently hospitalized)
  - Displays condition badge
  - Last visit date/time
  - Quick action buttons: View Details, View Records, Prescribe

**FR-D-008: View Recent Patients**
- **Description**: Doctor can see recently seen patients
- **User Story**: As a doctor, I want quick access to patients I recently treated
- **Acceptance Criteria**:
  - Sidebar card showing recent patients
  - Displays: Name, Age, Last Visit, Condition
  - Admission status badge if applicable
  - Pending lab notifications with count
  - Quick action buttons per patient

**FR-D-009: Manage Patients Modal**
- **Description**: Doctor can access full patient management interface
- **User Story**: As a doctor, I want to manage my patient panel in a dedicated interface
- **Acceptance Criteria**:
  - Opens full-screen modal
  - Search/filter capabilities
  - Bulk actions available
  - Patient assignment tools
  - Integrated with medical records if enabled

#### 7.2.5 Lab Results Management

**FR-D-010: Review Pending Lab Results**
- **Description**: Doctor can review laboratory results requiring attention
- **User Story**: As a doctor, I want to review and sign off on pending lab results
- **Acceptance Criteria**:
  - Counter shows number of pending labs
  - "Review Pending Labs" button with count
  - Opens lab review modal
  - Shows: Patient name, Test type, Date, Results summary
  - Critical results highlighted
  - Review status: Pending Review, Reviewed
  - Can mark as reviewed
  - Can view full lab details

**FR-D-011: View Lab Results in Patient Record**
- **Description**: Doctor can view all lab results within patient records
- **User Story**: As a doctor, I want to see all lab history for a patient
- **Acceptance Criteria**:
  - Lab Results accordion in patient details
  - Table: Test, Date, Summary, Review Status
  - Critical labs highlighted in red
  - CRITICAL - PENDING REVIEW badge for urgent items
  - Status badges: PENDING REVIEW (warning), REVIEWED (success), CRITICAL - PENDING REVIEW (danger)

#### 7.2.6 Consultation & Documentation

**FR-D-012: Start Video Consultation**
- **Description**: Doctor can initiate video calls with patients
- **User Story**: As a doctor, I want to conduct video consultations with remote patients
- **Acceptance Criteria**:
  - Available for Telehealth appointment types
  - "Start Video Call" button in appointment actions
  - Opens video platform in new window
  - Integrates with appointment record

**FR-D-013: Write Consultation Notes**
- **Description**: Doctor can document patient encounters
- **User Story**: As a doctor, I want to record consultation notes for patient records
- **Acceptance Criteria**:
  - "Start Consultation" button opens notes interface
  - Text area for: Observations, Diagnosis, Treatment plan
  - Auto-saves to patient record
  - Timestamps all entries
  - Associated with appointment

**FR-D-014: Edit Chief Complaint**
- **Description**: Doctor can modify patient chief complaint
- **User Story**: As a doctor, I want to clarify or update the chief complaint based on consultation
- **Acceptance Criteria**:
  - Only available if doctor has `canEditComplaints` permission
  - Opens edit modal with current complaint
  - Date reported field (editable)
  - Chief complaint text area
  - Updates appointment record
  - Saves with timestamp

#### 7.2.7 Messaging & Communication

**FR-D-015: View Patient Messages**
- **Description**: Doctor can view messages from patients
- **User Story**: As a doctor, I want to see messages from my patients
- **Acceptance Criteria**:
  - Unread message counter in dashboard metrics
  - Message list shows: Patient name, Subject, Preview, Date
  - Unread messages highlighted
  - Priority indicators for urgent messages
  - Click to view full message

**FR-D-016: Auto-Response to Patient Messages**
- **Description**: System automatically responds to patient messages
- **User Story**: As a doctor, I want patients to receive automatic acknowledgment when they message me
- **Acceptance Criteria**:
  - Triggers after patient sends message (2 second delay)
  - Generates context-aware responses based on keywords:
    - "appointment" → appointment-related response
    - "prescription" → prescription-related response
    - "pain" → symptom acknowledgment
    - "urgent" → priority escalation response
    - "test" → test result response
    - "refill" → refill processing response
  - Falls back to generic professional response
  - Creates new message record with doctor as sender
  - Marks as auto-generated (future: could add flag)

**FR-D-017: Send Message to Patient**
- **Description**: Doctor can send secure messages to patients
- **User Story**: As a doctor, I want to communicate with patients asynchronously
- **Acceptance Criteria**:
  - "Send Patient Message" button if `enableChat` enabled
  - Opens messaging interface
  - Select patient recipient
  - Compose subject and message
  - Send through secure messaging API
  - Saves to conversation history

| Rule # | Business Rule |
|--------|---------------|
| BR-D-044 | Doctor dashboard must display personalized greeting: "Welcome back, Dr. [Name]" |
| BR-D-045 | Dashboard metrics must show: today's appointments count, patients count, pending lab results count, and unread messages count |
| BR-D-046 | Quick Actions panel must include: Start Emergency Consultation, Manage Patients, Review Pending Labs, Schedule Appointment, and Send Patient Message (if enabled) |
| BR-D-047 | Dashboard must use two-column layout with main content (appointments, patients) and right sidebar (actions, recent patients) |
| BR-D-048 | Visual indicators must use semantic colors: priority normal (secondary), high (warning), urgent (danger) |

---

### 7.3 Nurse Dashboard

**Business Goal**: Enable nurses to deliver quality patient care through efficient vitals monitoring, medication administration tracking, patient triage, and coordinated communication with the healthcare team.

#### Patient Care Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-N-001 | Nurses must be able to view assigned patients showing name, room/bed, condition, status, last vitals, and actions |
| BR-N-002 | Patient list shall support filtering by department/unit |
| BR-N-003 | Patient acuity levels must be displayed: stable, moderate, or critical |
| BR-N-004 | Acuity levels must use color coding: stable (green), moderate (yellow), critical (red) |
| BR-N-005 | Nurses must be able to record vital signs with required fields: Blood Pressure, Heart Rate, Temperature, Respiratory Rate, SpO2 |
| BR-N-006 | Weight field in vitals recording is optional |
| BR-N-007 | Vital recording form must auto-populate date/time and patient information |
| BR-N-008 | System must validate vital sign numeric ranges and alert if values are outside normal ranges |
| BR-N-009 | All vital signs must save to patient record with timestamp |
| BR-N-010 | Vital trends must display as graph/chart view filterable by vital type and date range |
| BR-N-011 | Abnormal vital values must be highlighted in trend views |
| BR-N-012 | Vital trends must default to last 24 hours of data |
| BR-N-013 | Vital trend reports must be exportable |

#### Triage Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-N-014 | Nurses must be able to perform patient triage capturing chief complaint, vital signs, pain level (0-10), and acuity level |
| BR-N-015 | Acuity level options are: Non-urgent, Urgent, Emergency |
| BR-N-016 | Triage assessment must include free-text notes area |
| BR-N-017 | Triage must assign priority color coding: green (non-urgent), yellow (urgent), red (emergency) |
| BR-N-018 | High-priority triage must automatically alert the assigned doctor |

#### Medication Administration Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-N-019 | Medication Administration Record (MAR) must list all scheduled medications for current shift |
| BR-N-020 | MAR must show: patient, medication, dose, route, time due, and status |
| BR-N-021 | Medication status must be color-coded: overdue (red), due soon (yellow), administered (green), scheduled (gray) |
| BR-N-022 | MAR must be filterable by patient, time, and status |
| BR-N-023 | MAR must be sortable by due time |
| BR-N-024 | Nurses must confirm medication administration with acknowledgment: "I have administered this medication" |
| BR-N-025 | Medication administration must record: time administered, administering nurse, and optional patient response |
| BR-N-026 | Status must update to "Administered" upon confirmation |
| BR-N-027 | System must prevent duplicate administration of same dose |
| BR-N-028 | Nurses must be able to report medication issues with reasons: Patient refused, Patient NPO, Medication unavailable, Hold per physician, Patient condition changed |
| BR-N-029 | Medication issues must include free-text notes field |
| BR-N-030 | Medication issue reports must alert the prescribing physician |
| BR-N-031 | Medication status must update to "Held" or "Not Given" when issue is reported |
| BR-N-032 | Medication issues must create incident record for tracking |

#### Appointment Support Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-N-033 | Nurses must be able to view appointments filtered by their department |
| BR-N-034 | Department appointments must show: time, patient, doctor, type, status, and room |
| BR-N-035 | By default, today's appointments must be displayed |
| BR-N-036 | Nurses can view upcoming appointments for next 7 days |
| BR-N-037 | Nurses must be able to prepare patients for appointments using checklist: vitals recorded, chief complaint documented, medical history reviewed, consent forms signed |
| BR-N-038 | Preparation notes field must be available for doctor communication |
| BR-N-039 | When preparation complete, appointment status must update to "Ready for Doctor" |
| BR-N-040 | System must notify assigned physician when patient is ready |
| BR-N-041 | Room assignment board must show status: Available (green), Occupied (red), Cleaning (yellow) |
| BR-N-042 | Nurses must be able to assign patients to rooms via drag-and-drop |
| BR-N-043 | Room assignment must update appointment record with room number |
| BR-N-044 | Doctor must be alerted when patient is placed in room |
| BR-N-045 | System must track room occupancy time |

#### Communication & Documentation Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-N-046 | Nurse message inbox must filter for nurse-relevant messages |
| BR-N-047 | Messages must display priority indicators: normal, urgent, emergency |
| BR-N-048 | Nurses can route messages to doctors when beyond nursing scope |
| BR-N-049 | Nurses must be able to message doctors with patient context auto-attached when enableChat is true |
| BR-N-050 | Priority levels for doctor messages are: routine, urgent, stat |
| BR-N-051 | Urgent messages to doctors must trigger immediate notification |
| BR-N-052 | Nurses can send messages to patients with template message options |
| BR-N-053 | Nurse messages must be marked with nurse sender role |
| BR-N-054 | Nurses must be able to create nursing notes with types: Assessment, Intervention, Education, Response to Treatment |
| BR-N-055 | Nursing notes must follow structured format: Time, Observation, Action, Response |
| BR-N-056 | Nursing notes must auto-save every 30 seconds |
| BR-N-057 | All notes must be timestamped with nurse name |
| BR-N-058 | Nursing notes must be viewable by entire care team |
| BR-N-059 | Shift report must include: all patients under care, current status, pending tasks, and important alerts |
| BR-N-060 | Changes during shift must be highlighted in shift report |
| BR-N-061 | Shift reports must be printable |
| BR-N-062 | Shift reports must be shareable with oncoming shift nurse |

#### Lab Results & Emergency Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-N-063 | Nurses must have read-only access to patient lab results |
| BR-N-064 | Lab results display must show: test name, date, results, and normal ranges |
| BR-N-065 | Critical results must be flagged for nurse awareness |
| BR-N-066 | Lab results must be printable for doctor review |
| BR-N-067 | Nurses cannot approve or sign off on lab results |
| BR-N-068 | Critical alerts must trigger for: abnormal vitals, medication allergic reactions, patient deterioration, emergency calls |
| BR-N-069 | Alert types available are: visual (banner), audio (optional), push notification |
| BR-N-070 | Alert priority levels are: info (blue), warning (yellow), critical (red) |
| BR-N-071 | All alerts must be logged for review |
| BR-N-072 | Nurses must be able to acknowledge and dismiss alerts |
| BR-N-073 | Emergency Code button must be prominently displayed on nurse dashboard |
| BR-N-074 | Code types available are: Code Blue (cardiac arrest), Code Red (fire), Code Gray (combative person) |
| BR-N-075 | Emergency code activation must be one-click |
| BR-N-076 | Code activation must alert entire care team |
| BR-N-077 | System must log timestamp and initiating nurse for all codes |
| BR-N-078 | Emergency checklist must open upon code activation |

#### Dashboard & UI Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-N-079 | Nurse dashboard must display personalized greeting: "Welcome back, Nurse [Name]" |
| BR-N-080 | Dashboard metrics must show: patients under care count, medications due count, pending vital checks count, and unread messages count |
| BR-N-081 | Quick Actions panel must include: Record Vitals, Administer Medication, Triage Patient, Send Message (if enabled), View Shift Report |
| BR-N-082 | Dashboard must use three-section layout: patient list (left), main content (center), quick actions (right) |

---

### 7.4 Admin Portal

**Business Goal**: Provide administrators with comprehensive system control including user management, system configuration, platform monitoring, and feature governance to ensure smooth operation and compliance.

#### 7.3.2 Dashboard Features

**Welcome Screen**
- Display: "Nurse Dashboard" title
- Personalized greeting: "Welcome back, Nurse [Name]"
- System broadcast banner (if active)
- Quick metrics cards:
  - Patients under care count
  - Medications due count
  - Pending vital checks count
  - Unread messages count

**Quick Actions Panel**
- Record Vitals
- Administer Medication
- Triage Patient
- Send Message (if chat enabled)
- View Shift Report

#### 7.3.3 Patient Care Management

**FR-N-001: View Assigned Patients**
- **Description**: Nurse can view patients assigned to their care
- **User Story**: As a nurse, I want to see all patients I'm currently responsible for
- **Acceptance Criteria**:
  - Tabular view: Patient Name, Room/Bed, Condition, Status, Last Vitals, Actions
  - Department/unit-based filtering
  - Shows current admission status
  - Displays acuity level (stable, moderate, critical)
  - Quick action buttons: Record Vitals, View Details, Administer Meds

**FR-N-002: Record Patient Vitals**
- **Description**: Nurse can record patient vital signs
- **User Story**: As a nurse, I want to document vital signs during patient assessments
- **Acceptance Criteria**:
  - Opens vital recording modal
  - Fields: Blood Pressure (Systolic/Diastolic)*, Heart Rate*, Temperature*, Respiratory Rate*, SpO2*, Weight
  - Date/Time auto-populated (editable)
  - Patient information auto-filled
  - Validation: Required fields marked with *, numeric ranges enforced
  - Alerts if values outside normal ranges
  - Saves to patient record with timestamp
  - Displays in patient vital trends

**FR-N-003: View Patient Vital Trends**
- **Description**: Nurse can view historical vital signs
- **User Story**: As a nurse, I want to see vital sign trends to monitor patient status
- **Acceptance Criteria**:
  - Graph/chart view of vitals over time
  - Filterable by vital type and date range
  - Highlights abnormal values
  - Displays last 24 hours by default
  - Exportable for reporting

**FR-N-004: Triage Patients**
- **Description**: Nurse can perform patient triage and assign priority
- **User Story**: As a nurse, I want to assess and prioritize patients based on their needs
- **Acceptance Criteria**:
  - "Triage Patient" button opens triage assessment
  - Captures: Chief complaint, Vital signs, Pain level (0-10), Acuity level
  - Acuity levels: Non-urgent, Urgent, Emergency
  - Assessment notes text area
  - Assigns priority color coding (green/yellow/red)
  - Updates patient status
  - Alerts assigned doctor for high-priority cases

#### 7.3.4 Medication Administration

**FR-N-005: View Medication Administration Record (MAR)**
- **Description**: Nurse can view scheduled medications for patients
- **User Story**: As a nurse, I want to see which medications are due for administration
- **Acceptance Criteria**:
  - List of all scheduled medications for shift
  - Shows: Patient, Medication, Dose, Route, Time Due, Status
  - Color-coded: Overdue (red), Due Soon (yellow), Administered (green), Scheduled (gray)
  - Filterable by patient, time, status
  - Sortable by due time

**FR-N-006: Administer Medication**
- **Description**: Nurse can document medication administration
- **User Story**: As a nurse, I want to record when I give medications to patients
- **Acceptance Criteria**:
  - "Administer" button for each scheduled medication
  - Opens confirmation modal
  - Displays: Patient name, Medication, Dose, Route, Time
  - Nurse must confirm: "I have administered this medication"
  - Records: Time administered, Administering nurse, Patient response (optional)
  - Status updates to "Administered"
  - Generates timestamp
  - Cannot administer same dose twice (prevents duplicates)

**FR-N-007: Report Medication Issue**
- **Description**: Nurse can report medication administration problems
- **User Story**: As a nurse, I want to document when medications cannot be administered as ordered
- **Acceptance Criteria**:
  - "Report Issue" button for each medication
  - Reason options: Patient refused, Patient NPO, Medication unavailable, Hold per physician, Patient condition changed
  - Free text notes field
  - Alerts prescribing physician
  - Updates medication status to "Held" or "Not Given"
  - Creates incident record

#### 7.3.5 Appointment Support

**FR-N-008: View Department Appointments**
- **Description**: Nurse can view appointments for their department/unit
- **User Story**: As a nurse, I want to see which patients have appointments scheduled
- **Acceptance Criteria**:
  - View appointments filtered by nurse's department
  - Shows: Time, Patient, Doctor, Type, Status, Room
  - Today's appointments by default
  - Can view upcoming appointments (next 7 days)

**FR-N-009: Prepare Patient for Appointment**
- **Description**: Nurse can perform pre-appointment tasks
- **User Story**: As a nurse, I want to prepare patients before their doctor appointments
- **Acceptance Criteria**:
  - "Prepare" button for upcoming appointments
  - Checklist: Vitals recorded, Chief complaint documented, Medical history reviewed, Consent forms signed
  - Notes field for doctor
  - Updates appointment status to "Ready for Doctor"
  - Notifies assigned physician

**FR-N-010: Room Assignment**
- **Description**: Nurse can assign patients to exam/treatment rooms
- **User Story**: As a nurse, I want to assign patients to available rooms
- **Acceptance Criteria**:
  - Room status board: Available (green), Occupied (red), Cleaning (yellow)
  - Drag-and-drop patient to room
  - Updates appointment with room number
  - Alerts doctor when patient ready
  - Tracks room occupancy time

#### 7.3.6 Messaging & Communication

**FR-N-011: View Patient Messages**
- **Description**: Nurse can view messages from patients
- **User Story**: As a nurse, I want to see patient messages that need nursing response
- **Acceptance Criteria**:
  - Message inbox filtered for nurse-relevant messages
  - Priority indicators (normal, urgent, emergency)
  - Unread count in dashboard
  - Can route to doctor if beyond nursing scope

**FR-N-012: Send Message to Doctor**
- **Description**: Nurse can communicate with doctors about patients
- **User Story**: As a nurse, I want to message doctors regarding patient concerns
- **Acceptance Criteria**:
  - "Message Doctor" button if `enableChat` enabled
  - Select physician recipient
  - Patient context auto-attached
  - Priority selection (routine, urgent, stat)
  - Compose message with patient details
  - Urgent messages trigger immediate notification

**FR-N-013: Send Message to Patient**
- **Description**: Nurse can send messages to patients
- **User Story**: As a nurse, I want to communicate instructions to patients
- **Acceptance Criteria**:
  - Messaging interface for patient communication
  - Template messages for common scenarios
  - Can attach documents (care instructions, etc.)
  - Messages marked with nurse sender role

#### 7.3.7 Documentation & Reporting

**FR-N-014: Create Nursing Notes**
- **Description**: Nurse can document patient care activities
- **User Story**: As a nurse, I want to record nursing observations and interventions
- **Acceptance Criteria**:
  - "Add Note" button in patient details
  - Note type: Assessment, Intervention, Education, Response to Treatment
  - Structured format: Time, Observation, Action, Response
  - Auto-saves every 30 seconds
  - Timestamped with nurse name
  - Viewable by care team

**FR-N-015: Generate Shift Report**
- **Description**: Nurse can create shift handoff reports
- **User Story**: As a nurse, I want to provide shift reports to incoming nurses
- **Acceptance Criteria**:
  - "Shift Report" button generates summary
  - Includes: All patients under care, Current status, Pending tasks, Important alerts
  - Changes during shift highlighted
  - Printable format
  - Shareable with oncoming shift nurse

**FR-N-016: View Patient Lab Results**
- **Description**: Nurse can view laboratory results for patients
- **User Story**: As a nurse, I want to see lab results to monitor patient condition
- **Acceptance Criteria**:
  - Access lab results through patient record
  - Shows: Test name, Date, Results, Normal ranges
  - Critical results flagged
  - Can print for doctor review
  - Read-only access (cannot approve/sign off)

#### 7.3.8 Emergency & Alerts

**FR-N-017: Receive Critical Alerts**
- **Description**: Nurse receives alerts for critical patient conditions
- **User Story**: As a nurse, I want immediate notification of critical patient events
- **Acceptance Criteria**:
  - Real-time alerts for: Abnormal vitals, Medication allergic reactions, Patient deterioration, Emergency calls
  - Alert types: Visual (banner), Audio (optional), Push notification
  - Priority levels: Info (blue), Warning (yellow), Critical (red)
  - Alert log for review
  - Can acknowledge/dismiss alerts

**FR-N-018: Initiate Code Response**
- **Description**: Nurse can activate emergency code procedures
- **User Story**: As a nurse, I want to quickly initiate emergency response protocols
- **Acceptance Criteria**:
  - "Emergency Code" button prominently displayed
  - Code types: Code Blue (cardiac arrest), Code Red (fire), Code Gray (combative person)
  - One-click activation
  - Alerts entire care team
  - Logs timestamp and initiating nurse
  - Opens emergency checklist

#### 7.3.9 UI & Navigation

**Layout**:
- Three-section layout: Patient list (left), Main content (center), Quick actions (right)
- Color-coded patient cards by acuity
- Medication due timeline view
- Modal-based data entry forms

**Visual Indicators**:
- Acuity color coding: Stable (green), Moderate (yellow), Critical (red)
- Medication status badges
- Vital sign alerts (abnormal values in red)
- Room occupancy status lights
- Message priority indicators

---

### 7.4 Admin Portal

#### 7.4.1 Overview
The Admin Portal provides system administrators with comprehensive tools to manage users, configure system settings, monitor platform health, manage feature flags, control mock data, and generate reports for the telehealth platform.

#### User Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-001 | Admin must be able to view all users in tabular format showing Name, Email, Role, Status, Last Login, and Actions |
| BR-A-002 | User directory must be filterable by Role (patient, doctor, nurse, admin) and Status (active, inactive, suspended) |
| BR-A-003 | User directory must be sortable by all columns |
| BR-A-004 | User directory must include search functionality by name, email, or ID |
| BR-A-005 | User listing must use pagination displaying 50 users per page |
| BR-A-006 | System must display user count by role |
| BR-A-007 | User directory must have Export to CSV functionality |
| BR-A-008 | Admin must be able to create new user accounts with required fields: First Name, Last Name, Email, Role, Password |
| BR-A-009 | User creation must support optional fields: Phone, Date of Birth, Address, Specialty (doctors), Department (nurses) |
| BR-A-010 | Role dropdown must offer: Patient, Doctor, Nurse, Admin |
| BR-A-011 | System must validate email for uniqueness and proper format |
| BR-A-012 | Password must meet requirements: minimum 8 characters, 1 uppercase, 1 number, 1 special character |
| BR-A-013 | User ID must auto-generate using format: role prefix + timestamp |
| BR-A-014 | System must send welcome email with credentials upon user creation |
| BR-A-015 | Admin must be able to edit user details: Name, Email, Phone, Role, Status, Specialty, Department |
| BR-A-016 | User ID and Registration Date fields cannot be edited |
| BR-A-017 | Role changes must trigger permission update immediately |
| BR-A-018 | Email changes must send verification to new email address |
| BR-A-019 | All user modifications must be tracked in audit log |
| BR-A-020 | Admin must be able to deactivate user accounts changing status to inactive |
| BR-A-021 | Deactivated users cannot log in to the system |
| BR-A-022 | Admin must be able to reactivate user accounts restoring access |
| BR-A-023 | Deactivation must require confirmation dialog |
| BR-A-024 | System must capture deactivation reason: Resigned, Terminated, Temporary Leave, Policy Violation |
| BR-A-025 | Deactivation must log reason and deactivating admin user |
| BR-A-026 | System must send notification email to user upon deactivation |
| BR-A-027 | Admin must be able to reset user passwords with two options: Generate temporary password or Send reset link |
| BR-A-028 | Temporary passwords must expire in 24 hours |
| BR-A-029 | Password reset must force password change on next login |
| BR-A-030 | All password reset actions must be logged |
| BR-A-031 | Admin must be able to configure role-based permissions via permission matrix |
| BR-A-032 | Permission matrix must show all features with checkboxes per role |
| BR-A-033 | Permissions must include: View Patients, Edit Patients, Prescribe, Schedule Appointments, Access Medical Records, Manage Users, System Settings |
| BR-A-034 | Permission changes apply to all users of that role |
| BR-A-035 | Permission modifications require confirmation before saving |
| BR-A-036 | All permission changes must be audit logged |

#### System Configuration Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-037 | Admin must be able to modify platform-wide settings organized by category: General, Notifications, Appointments, Messaging, Security |
| BR-A-038 | General settings must include: Platform name, Logo upload, Contact email, Timezone, Date format |
| BR-A-039 | Notification settings must include: Email server (SMTP), SMS provider (Twilio), Push notifications |
| BR-A-040 | Appointment settings must include: Available time slots, Booking advance limit, Cancellation window, Default duration |
| BR-A-041 | Messaging settings must include: Auto-response delay, Message retention period, Attachment size limit |
| BR-A-042 | Security settings must include: Session timeout, Password policy, Two-factor auth toggle, IP whitelist |
| BR-A-043 | All setting changes require "Save Changes" confirmation |
| BR-A-044 | System must validate configuration before applying changes |
| BR-A-045 | Admin must be able to manage appointment types including: Telehealth, In-Person, Follow-Up, Emergency, Specialist, Routine Check-up, Lab Work, Vaccination, Consultation |
| BR-A-046 | New appointment types must include fields: Name, Color code, Default duration, Description |
| BR-A-047 | Existing appointment types must be editable |
| BR-A-048 | Appointment types in use cannot be deleted but can be deactivated |
| BR-A-049 | Appointment types must support reordering for display priority |
| BR-A-050 | Appointment type changes must reflect immediately in booking interfaces |
| BR-A-051 | Admin must be able to manage medical specialties list including: Cardiology, General Practice, Dermatology, Pediatrics |
| BR-A-052 | Specialties must support add/edit/deactivate operations |
| BR-A-053 | Admin must be able to manage nursing departments including: Emergency, ICU, Pediatrics, Surgery |
| BR-A-054 | Departments must support add/edit/deactivate operations |
| BR-A-055 | Admin must be able to assign providers to specialties and departments |
| BR-A-056 | Specialties and departments must be used for patient routing and filtering |

#### Feature Flag Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-057 | Admin must be able to view all feature flags with current state (enabled/disabled) |
| BR-A-058 | Feature flags must include: enableChat, enableTelehealth, enableMedicalRecords, enablePrescriptionRefills, enableAppointmentRescheduling, enableLabResults, enableInsurancePortal |
| BR-A-059 | Feature flag display must show: Flag name, Description, Status toggle, Last modified, Modified by |
| BR-A-060 | Feature flag status must use color coding: green (enabled), gray (disabled) |
| BR-A-061 | Admin must be able to toggle feature flags on or off |
| BR-A-062 | Critical feature changes must require confirmation dialog |
| BR-A-063 | System must display warning when disabling feature in active use |
| BR-A-064 | Feature flag changes must take effect immediately or after cache clear |
| BR-A-065 | All feature flag changes must be logged with timestamp and admin user |
| BR-A-066 | Admin must be able to schedule feature activation for future date/time |
| BR-A-067 | Admin must be able to configure feature access by role with options: All Users, Patients Only, Providers Only, Specific Roles |
| BR-A-068 | Each feature flag must have role-specific settings |
| BR-A-069 | System must provide granular control matrix for feature-role combinations |
| BR-A-070 | Admin must be able to preview user experience per role for feature flags |

#### Mock Data Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-071 | Admin must be able to view mock data toggle status prominently displayed |
| BR-A-072 | System must display warning banner if mock data enabled in production environment |
| BR-A-073 | Mock data status must show: Mock users count, Mock appointments count, Mock prescriptions count, Mock messages count |
| BR-A-074 | Mock data status must display last reset timestamp |
| BR-A-075 | System must display environment indicator (Development/Production) |
| BR-A-076 | Admin must be able to toggle between real and test data |
| BR-A-077 | Mock data enablement must require confirmation: "This will replace real data with test data. Continue?" |
| BR-A-078 | When mock data enabled, system must use LocalStorage-based mock data |
| BR-A-079 | When mock data disabled, system must use MongoDB database |
| BR-A-080 | Mock data cannot be enabled in production without override password |
| BR-A-081 | Mock data status indicator must appear on every page header when active |
| BR-A-082 | Admin must be able to reset mock data to default state |
| BR-A-083 | Mock data reset must require confirmation dialog with warning |
| BR-A-084 | Reset must restore all mock entities to initial values |
| BR-A-085 | Reset must clear LocalStorage completely |
| BR-A-086 | Reset must reload predefined test patients, appointments, prescriptions, and messages |
| BR-A-087 | Mock data reset action must be logged |
| BR-A-088 | Page must refresh automatically after reset |
| BR-A-089 | Admin must be able to export mock data as JSON file download |
| BR-A-090 | Admin must be able to import mock data via JSON file upload |
| BR-A-091 | System must validate import file structure before applying |
| BR-A-092 | Import must offer option to merge with existing or replace |
| BR-A-093 | All import operations must be logged |

#### System Monitoring Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-094 | Admin must be able to monitor platform operational status via health dashboard |
| BR-A-095 | Health metrics must include: Database connection status, API response time, Server uptime, Memory usage, CPU usage |
| BR-A-096 | Health status must use color-coded indicators: green (healthy), yellow (warning), red (critical) |
| BR-A-097 | Health dashboard must include manual refresh button |
| BR-A-098 | Health dashboard must auto-refresh every 30 seconds |
| BR-A-099 | Health dashboard must link to /api/health endpoint |
| BR-A-100 | Admin must be able to check MongoDB connection and performance |
| BR-A-101 | Database status must show: Connection status, Pool size (current/max), Active connections, Database name, Cluster info |
| BR-A-102 | Database monitoring must display response time metrics |
| BR-A-103 | System must log database connection errors |
| BR-A-104 | System must display reconnection attempts counter |
| BR-A-105 | Database monitoring must include "Test Connection" button for manual verification |
| BR-A-106 | Admin must be able to review application errors in tabular format showing: Timestamp, Error type, Message, User, Endpoint, Stack trace |
| BR-A-107 | Error logs must be filterable by: Date range, Error type, User role, Endpoint |
| BR-A-108 | Error logs must be sortable by timestamp with newest first default |
| BR-A-109 | Error logs must use pagination |
| BR-A-110 | Error logs must be exportable to file for developer review |
| BR-A-111 | Error logs must include "Clear Logs" button with confirmation |
| BR-A-112 | Admin must be able to track user actions via audit logs for security and compliance |
| BR-A-113 | Audit logs must include: User login/logout, User created/modified/deleted, Password resets, Permission changes, Settings modified, Feature flags toggled, Sensitive data access |
| BR-A-114 | Audit log entries must show: Timestamp, User, Action, Target, IP address, Details |
| BR-A-115 | Audit logs must be filterable by date, user, and action type |
| BR-A-116 | Audit logs must be exportable for compliance reporting |
| BR-A-117 | Audit logs cannot be modified or deleted (append-only) |
| BR-A-118 | Audit logs must be retained per compliance policy (e.g., 7 years for HIPAA) |

#### Analytics & Reporting Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-119 | Admin must be able to view platform usage statistics |
| BR-A-120 | Usage metrics must include: Daily active users, Appointments booked (by type), Messages sent, Prescriptions written, Login frequency |
| BR-A-121 | Analytics must display data as: Line charts (trends), Bar charts (comparisons), Pie charts (distribution) |
| BR-A-122 | Analytics must include date range selector: Last 7 days, 30 days, 90 days, Custom |
| BR-A-123 | Usage analytics must provide breakdown by user role |
| BR-A-124 | Analytics must include peak usage times heatmap |
| BR-A-125 | Admin must be able to generate custom reports with types: User Activity, Appointment Statistics, Provider Performance, System Usage, Compliance Report |
| BR-A-126 | Reports must support configurable parameters: Date range, User role filter, Provider filter, Metric selection |
| BR-A-127 | Reports must be exportable in formats: PDF, Excel, CSV |
| BR-A-128 | Admin must be able to schedule automated reports (daily, weekly, monthly) |
| BR-A-129 | Automated reports must support email delivery option |
| BR-A-130 | Admin dashboard must display key metrics: Total users by role, Total appointments (today/week/month), Active sessions count, System errors (last 24 hours), Database health status, Feature flag summary |

#### Broadcast Messaging Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-131 | Admin must be able to create platform-wide system broadcasts |
| BR-A-132 | System broadcast must include required fields: Title, Message |
| BR-A-133 | Broadcast must support target audience options: All Users, Patients, Providers, Specific Role |
| BR-A-134 | Broadcast must support display options: Banner (top of all pages), Modal (on login), Email notification |
| BR-A-135 | Broadcast must include Start date/time and End date/time fields |
| BR-A-136 | Broadcast must support priority levels: Info, Warning, Critical |
| BR-A-137 | Admin must be able to preview broadcast before sending |
| BR-A-138 | Active broadcasts must show on all dashboards |
| BR-A-139 | Admin must be able to edit or deactivate active broadcasts |

#### Data Management Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-140 | Admin must be able to trigger manual database backups |
| BR-A-141 | System must display last backup timestamp |
| BR-A-142 | Database backup must require confirmation before starting |
| BR-A-143 | System must display progress indicator during backup |
| BR-A-144 | System must provide success/failure notification for backup operations |
| BR-A-145 | Backups must be stored to configured location (MongoDB Atlas) |
| BR-A-146 | Admin must be able to schedule automatic backups (daily, weekly) |
| BR-A-147 | Admin must be able to export data for migration or reporting with options: Users, Appointments, Messages, Prescriptions, All Data |
| BR-A-148 | Data export must support date range filtering |
| BR-A-149 | Export must support formats: JSON, CSV, Excel |
| BR-A-150 | Export must include anonymization option to remove PHI |
| BR-A-151 | Large exports must process asynchronously with download link |
| BR-A-152 | All export actions must be logged for compliance |

#### Dashboard & UI Rules

| Rule # | Business Rule |
|--------|---------------|
| BR-A-153 | Admin portal must display "Admin Portal" title |
| BR-A-154 | Dashboard must show system status overview card |
| BR-A-155 | Dashboard must display quick metrics: Total users count by role, System uptime, Active sessions, Database health status, Recent errors count |
| BR-A-156 | Quick Actions panel must include: Add New User, System Settings, Feature Flags, Mock Data Manager, View Audit Logs, Generate Reports, Database Backup |
| BR-A-157 | Admin portal must use multi-section layout: Metrics cards (top), Settings tabs (center), Quick actions (sidebar) |
| BR-A-158 | Admin interface must use tabbed navigation for different admin functions |
| BR-A-159 | Admin forms must use modal-based creation/editing |
| BR-A-160 | Admin data displays must use table format with filters |
| BR-A-161 | System health must use status lights: green/yellow/red |
| BR-A-162 | Feature flags must use toggle switches with status colors |
| BR-A-163 | User status must display badges: active/inactive/suspended |
| BR-A-164 | System must display alert indicators for errors and warnings |
| BR-A-165 | Mock data warning banner must be yellow when active |

---
- Dashboard (default)
- User Management
- System Settings
- Feature Flags
- Mock Data
- Monitoring
- Reports
- Audit Logs

---

## 8. Non-Functional Requirements

### 8.1 Performance Requirements

**NFR-P-001: Response Time**
- API response time: < 200ms for 95% of requests
- Page load time: < 2 seconds on broadband connection
- Database query optimization with proper indexing
- Connection pooling configured (min: 2, max: 10 connections)

**NFR-P-002: Concurrent Users**
- Support 1,000 concurrent active users
- Support 10,000 registered users
- Scalable architecture for growth
- Load balancing capability

**NFR-P-003: Database Performance**
- MongoDB indexes on frequently queried fields
- Existing indexes: Message model (conversationId, senderId/recipientId, read status)
- Query response time: < 100ms for indexed queries
- Connection auto-recovery with exponential backoff (max 5 retries)

### 8.2 Security Requirements

**NFR-S-001: Authentication**
- JWT-based authentication (jsonwebtoken 9.0.2)
- Bcrypt password hashing (bcryptjs 2.4.3)
- Secure password storage (never plain text)
- Password requirements: Minimum 8 characters, uppercase, number, special character
- Session management with configurable timeout

**NFR-S-002: Authorization**
- Role-based access control (RBAC)
- Granular permissions matrix (see Section 6.2)
- API endpoint protection via middleware
- Front-end feature gating based on permissions

**NFR-S-003: Data Encryption**
- HTTPS/TLS for all communications (enforced)
- Data encryption at rest (MongoDB Atlas default)
- Secure credential storage in environment variables
- No sensitive data in client-side code

**NFR-S-004: CORS & API Security**
- CORS configured for specific origins only
- Production origin: https://henrydjorgee.com
- Development origin: http://localhost:3000
- Request validation and sanitization
- Rate limiting to prevent abuse

### 8.3 Availability & Reliability

**NFR-A-001: Uptime**
- Target: 99.9% uptime (< 8.76 hours downtime/year)
- Graceful degradation when services unavailable
- Health monitoring endpoint: /api/health

**NFR-A-002: Error Handling**
- Comprehensive error logging
- User-friendly error messages (no stack traces exposed)
- Automatic retry logic for transient failures
- Database auto-reconnection with exponential backoff

**NFR-A-003: Data Backup**
- MongoDB Atlas automated backups
- Point-in-time recovery capability
- Backup retention per compliance requirements
- Disaster recovery plan

### 8.4 Scalability

**NFR-SC-001: Horizontal Scaling**
- Stateless API design for horizontal scaling
- Load balancer compatibility
- Connection pooling for database efficiency
- Caching strategy for frequently accessed data

**NFR-SC-002: Data Growth**
- Database schema supports millions of records
- Efficient indexing strategy
- Archive/purge policies for old data
- Message retention policies

### 8.5 Usability

**NFR-U-001: Browser Compatibility**
- Modern browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Responsive design: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
- React 19.1.1 with Bootstrap 5 for UI consistency

**NFR-U-002: Accessibility**
- WCAG 2.1 Level AA compliance (goal)
- Keyboard navigation support
- Screen reader compatibility
- Semantic HTML structure
- Color contrast ratios meet accessibility standards

**NFR-U-003: Mobile Responsiveness**
- Mobile-first design approach
- Touch-friendly UI elements
- Optimized for small screens
- Progressive Web App capabilities (future)

### 8.6 Compliance & Standards

**NFR-C-001: HIPAA Compliance**
- PHI (Protected Health Information) encryption
- Access controls and audit logging
- Minimum necessary access principle
- Business Associate Agreements (BAAs) with vendors
- Data retention and destruction policies

**NFR-C-002: Audit Logging**
- Log all access to PHI
- User authentication events
- Administrative actions
- Data modifications
- Logs immutable and retained per policy (7 years recommended)

**NFR-C-003: Data Privacy**
- Patient consent management
- Right to access personal data
- Right to request data deletion (with legal constraints)
- Privacy policy and terms of service
- Cookie consent management

### 8.7 Maintainability

**NFR-M-001: Code Quality**
- Modular architecture
- Clear separation of concerns (MVC pattern)
- Comprehensive inline comments
- Consistent coding standards
- Version control (Git)

**NFR-M-002: Documentation**
- API documentation (endpoints, request/response schemas)
- Database schema documentation
- Deployment procedures
- User manuals per role
- This BRD serves as requirements documentation

**NFR-M-003: Monitoring & Logging**
- Application logging (errors, warnings, info)
- Performance monitoring
- Database connection monitoring
- Health check endpoints
- Error tracking and alerting

### 8.8 Deployment & Environment

**NFR-D-001: Deployment Platform**
- CloudLinux Passenger application server
- Node.js runtime environment
- Production domain: henrydjorgee.com
- HTTPS enforced

**NFR-D-002: Environment Configuration**
- Separate production and development environments
- Environment variables for configuration (.env files)
- No hardcoded credentials
- Configuration validation on startup

**NFR-D-003: Dependency Management**
- Package.json for Node.js dependencies
- Version pinning for critical packages
- Regular security updates
- Dependency vulnerability scanning

---

## 9. Data Models & Database Schema

### 9.1 Overview
The system uses MongoDB (via Mongoose ODM) for data persistence. Current implementation includes the Message model. Additional models required for full functionality are documented below.

### 9.2 Message Model (IMPLEMENTED)

**Collection**: `messages`

**Schema**:
```javascript
{
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true, index: true },
  senderName: { type: String, required: true },
  senderRole: { 
    type: String, 
    required: true, 
    enum: ['patient', 'doctor', 'nurse', 'admin'] 
  },
  recipientId: { type: String, required: true, index: true },
  recipientName: { type: String, required: true },
  recipientRole: { 
    type: String, 
    required: true, 
    enum: ['patient', 'doctor', 'nurse', 'admin'] 
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  attachments: [{ 
    filename: String, 
    url: String, 
    fileType: String 
  }],
  messageType: {
    type: String,
    enum: ['text', 'appointment', 'prescription', 'test-result', 'system'],
    default: 'text'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  relatedAppointmentId: { type: String },
  relatedPrescriptionId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
- Compound index: `{ conversationId: 1, createdAt: -1 }` - For retrieving conversation messages chronologically
- Compound index: `{ senderId: 1, recipientId: 1, createdAt: -1 }` - For user-to-user message queries
- Single index: `{ read: 1 }` - For unread message filtering

**Virtual Properties**:
- `formattedTime`: Returns createdAt in human-readable format

**Relationships**:
- References User model via senderId and recipientId
- References Appointment model via relatedAppointmentId
- References Prescription model via relatedPrescriptionId

---

### 9.3 User Model (REQUIRED - NOT IMPLEMENTED)

**Collection**: `users`

**Schema**:
```javascript
{
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // bcrypt hashed
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['patient', 'doctor', 'nurse', 'admin'] 
  },
  
  // Contact Information
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  
  // Demographics
  dateOfBirth: { type: Date },
  sex: { type: String, enum: ['male', 'female', 'other', 'prefer-not-to-say'] },
  bloodType: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
  },
  
  // Medical Information (Patients)
  allergies: [{ 
    allergen: String, 
    reaction: String, 
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] }
  }],
  medicalConditions: [String],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Insurance Information (Patients)
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    memberId: String,
    planType: { 
      type: String, 
      enum: ['basic', 'silver', 'gold', 'gold-plus', 'platinum'] 
    },
    effectiveDate: Date,
    expirationDate: Date,
    copay: {
      primaryCare: Number,
      specialist: Number,
      emergency: Number
    },
    deductible: Number,
    outOfPocketMax: Number
  },
  
  // Provider Information (Doctors/Nurses)
  specialty: { type: String }, // For doctors
  department: { type: String }, // For nurses
  licenseNumber: { type: String },
  npiNumber: { type: String }, // National Provider Identifier
  
  // Permissions
  permissions: {
    canPrescribe: { type: Boolean, default: false },
    canEditComplaints: { type: Boolean, default: false },
    canAccessMedicalRecords: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canConfigureSystem: { type: Boolean, default: false }
  },
  
  // Account Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  passwordChangedAt: { type: Date },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String }, // Admin userId who created the account
  deactivatedAt: { type: Date },
  deactivationReason: { type: String }
}
```

**Indexes**:
- Unique: `{ userId: 1 }`
- Unique: `{ email: 1 }`
- `{ role: 1, status: 1 }` - For admin user filtering
- `{ specialty: 1 }` - For doctor searching
- `{ department: 1 }` - For nurse assignment

**Methods**:
- `comparePassword(candidatePassword)` - Compare input with hashed password
- `changedPasswordAfter(JWTTimestamp)` - Check if password changed after token issued
- `createPasswordResetToken()` - Generate password reset token

---

### 9.4 Appointment Model (REQUIRED - NOT IMPLEMENTED)

**Collection**: `appointments`

**Schema**:
```javascript
{
  appointmentId: { type: String, required: true, unique: true },
  
  // Patient Information
  patientId: { type: String, required: true, ref: 'User' },
  patientName: { type: String, required: true },
  patientEmail: { type: String },
  patientPhone: { type: String },
  patientDob: { type: Date },
  
  // Provider Information
  doctorId: { type: String, ref: 'User' },
  doctorName: { type: String },
  assignedNurseId: { type: String, ref: 'User' },
  assignedNurseName: { type: String },
  
  // Appointment Details
  appointmentType: { 
    type: String, 
    required: true,
    enum: ['Telehealth', 'In-Person', 'Follow-Up', 'Emergency', 'Specialist', 
           'Routine Check-up', 'Lab Work', 'Vaccination', 'Consultation'] 
  },
  preferredDate: { type: Date, required: true },
  preferredTime: { type: String, required: true },
  duration: { type: Number, default: 30 }, // in minutes
  
  // Clinical Information
  chiefComplaint: { type: String },
  reasonForVisit: { type: String },
  symptoms: [String],
  dateReported: { type: Date },
  
  // Appointment Status
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'confirmed', 'scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'pending' 
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Location (for In-Person appointments)
  room: { type: String },
  location: { type: String },
  
  // Telehealth Details
  meetingUrl: { type: String }, // Zoom/video platform link
  meetingPassword: { type: String },
  
  // Administrative
  scheduledBy: { type: String, ref: 'User' }, // Admin who scheduled
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  
  // Notes
  consultationNotes: { type: String },
  nurseNotes: { type: String },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
- Unique: `{ appointmentId: 1 }`
- `{ patientId: 1, preferredDate: -1 }` - Patient appointment history
- `{ doctorId: 1, preferredDate: 1 }` - Doctor's schedule
- `{ status: 1, preferredDate: 1 }` - Filtering appointments
- `{ preferredDate: 1, preferredTime: 1 }` - Scheduling conflicts

---

### 9.5 Prescription Model (REQUIRED - NOT IMPLEMENTED)

**Collection**: `prescriptions`

**Schema**:
```javascript
{
  prescriptionId: { type: String, required: true, unique: true },
  
  // Patient Information
  patientId: { type: String, required: true, ref: 'User' },
  patientName: { type: String, required: true },
  
  // Provider Information
  doctorId: { type: String, required: true, ref: 'User' },
  doctorName: { type: String, required: true },
  doctorSignature: { type: String }, // Digital signature
  
  // Medication Details
  medication: { type: String, required: true },
  genericName: { type: String },
  dosage: { type: String, required: true }, // e.g., "500mg"
  frequency: { type: String, required: true }, // e.g., "Twice daily"
  route: { 
    type: String, 
    enum: ['oral', 'topical', 'injection', 'inhalation', 'sublingual', 'other'],
    default: 'oral'
  },
  quantity: { type: Number, required: true },
  refills: { type: Number, default: 0 },
  refillsRemaining: { type: Number },
  
  // Instructions
  instructions: { type: String, required: true },
  warnings: [String],
  sideEffects: [String],
  
  // Prescription Status
  status: {
    type: String,
    enum: ['active', 'pending', 'ready', 'collected', 'expired', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Pharmacy Information
  pharmacy: {
    name: String,
    phone: String,
    address: String
  },
  
  // Related Entities
  relatedAppointmentId: { type: String, ref: 'Appointment' },
  relatedDiagnosis: { type: String },
  
  // Dates
  datePrescribed: { type: Date, default: Date.now },
  startDate: { type: Date },
  endDate: { type: Date },
  expirationDate: { type: Date },
  lastRefillDate: { type: Date },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  cancelledAt: { type: Date },
  cancellationReason: { type: String }
}
```

**Indexes**:
- Unique: `{ prescriptionId: 1 }`
- `{ patientId: 1, status: 1 }` - Active prescriptions lookup
- `{ doctorId: 1, datePrescribed: -1 }` - Doctor prescription history
- `{ status: 1, expirationDate: 1 }` - Expired prescription cleanup

---

### 9.6 LabResult Model (REQUIRED - NOT IMPLEMENTED)

**Collection**: `labresults`

**Schema**:
```javascript
{
  labResultId: { type: String, required: true, unique: true },
  
  // Patient Information
  patientId: { type: String, required: true, ref: 'User' },
  patientName: { type: String, required: true },
  
  // Provider Information
  orderingDoctorId: { type: String, required: true, ref: 'User' },
  orderingDoctorName: { type: String },
  reviewingDoctorId: { type: String, ref: 'User' },
  reviewingDoctorName: { type: String },
  
  // Test Information
  testName: { type: String, required: true },
  testCategory: { 
    type: String,
    enum: ['blood', 'urine', 'imaging', 'biopsy', 'culture', 'other']
  },
  testCode: { type: String }, // Standard lab code (LOINC)
  
  // Results
  results: [{
    parameter: String,
    value: String,
    unit: String,
    referenceRange: String,
    flag: { 
      type: String, 
      enum: ['normal', 'low', 'high', 'critical'] 
    }
  }],
  resultsSummary: { type: String },
  interpretation: { type: String },
  
  // Status
  status: {
    type: String,
    enum: ['ordered', 'collected', 'processing', 'completed', 'cancelled'],
    default: 'ordered'
  },
  reviewStatus: {
    type: String,
    enum: ['pending-review', 'reviewed', 'critical-pending', 'acknowledged'],
    default: 'pending-review'
  },
  criticalResult: { type: Boolean, default: false },
  
  // Related Entities
  relatedAppointmentId: { type: String, ref: 'Appointment' },
  
  // Dates
  orderDate: { type: Date, default: Date.now },
  collectionDate: { type: Date },
  resultDate: { type: Date },
  reviewDate: { type: Date },
  
  // Laboratory Information
  laboratory: {
    name: String,
    address: String,
    phone: String
  },
  
  // Documents
  reportUrl: { type: String }, // PDF or document link
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}
```

**Indexes**:
- Unique: `{ labResultId: 1 }`
- `{ patientId: 1, resultDate: -1 }` - Patient lab history
- `{ orderingDoctorId: 1, reviewStatus: 1 }` - Pending reviews for doctor
- `{ reviewStatus: 1, criticalResult: 1 }` - Critical results needing attention

---

### 9.7 AuditLog Model (REQUIRED - NOT IMPLEMENTED)

**Collection**: `auditlogs`

**Schema**:
```javascript
{
  logId: { type: String, required: true, unique: true },
  
  // User Information
  userId: { type: String, required: true, ref: 'User' },
  userName: { type: String, required: true },
  userRole: { 
    type: String, 
    enum: ['patient', 'doctor', 'nurse', 'admin'] 
  },
  
  // Action Details
  action: { type: String, required: true },
  actionType: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'login', 'logout', 'access', 'export'],
    required: true
  },
  targetType: {
    type: String,
    enum: ['user', 'patient', 'appointment', 'prescription', 'message', 'lab-result', 'system-setting', 'feature-flag'],
    required: true
  },
  targetId: { type: String },
  
  // Details
  details: { type: Object }, // JSON object with action-specific data
  changesBefore: { type: Object }, // State before change
  changesAfter: { type: Object }, // State after change
  
  // Context
  ipAddress: { type: String },
  userAgent: { type: String },
  sessionId: { type: String },
  
  // Security
  phiAccessed: { type: Boolean, default: false }, // Protected Health Information flag
  complianceFlag: { type: Boolean, default: false }, // For HIPAA-relevant actions
  
  // Metadata
  timestamp: { type: Date, default: Date.now, index: true },
  createdAt: { type: Date, default: Date.now }
}
```

**Indexes**:
- Unique: `{ logId: 1 }`
- `{ userId: 1, timestamp: -1 }` - User activity history
- `{ actionType: 1, timestamp: -1 }` - Filter by action
- `{ phiAccessed: 1, timestamp: -1 }` - HIPAA compliance reporting
- `{ timestamp: -1 }` - Chronological retrieval

**Retention Policy**: Retain for 7 years per HIPAA requirements

---

### 9.8 SystemSetting Model (REQUIRED - NOT IMPLEMENTED)

**Collection**: `systemsettings`

**Schema**:
```javascript
{
  settingKey: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: ['general', 'notifications', 'appointments', 'messaging', 'security', 'features'],
    required: true
  },
  value: { type: Schema.Types.Mixed, required: true },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  description: { type: String },
  isPublic: { type: Boolean, default: false }, // Can non-admins view this?
  
  // Metadata
  lastModifiedBy: { type: String, ref: 'User' },
  lastModifiedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}
```

**Example Settings**:
- `platform.name`: "Telehealth Platform"
- `session.timeout`: 3600 (seconds)
- `appointments.timeslots`: ["9:00 AM", "10:00 AM", ...]
- `features.enableChat`: true
- `notifications.autoResponseDelay`: 2000 (milliseconds)

**Indexes**:
- Unique: `{ settingKey: 1 }`
- `{ category: 1 }` - Group settings by category

---

### 9.9 FeatureFlag Model (REQUIRED - NOT IMPLEMENTED)

**Collection**: `featureflags`

**Schema**:
```javascript
{
  flagKey: { type: String, required: true, unique: true },
  flagName: { type: String, required: true },
  description: { type: String },
  enabled: { type: Boolean, default: false },
  
  // Role-based access
  enabledForRoles: [{
    type: String,
    enum: ['patient', 'doctor', 'nurse', 'admin', 'all']
  }],
  
  // Scheduling
  scheduledEnableDate: { type: Date },
  scheduledDisableDate: { type: Date },
  
  // Metadata
  lastModifiedBy: { type: String, ref: 'User' },
  lastModifiedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
}
```

**Example Feature Flags**:
- `enableChat`: Allow messaging between users
- `enableTelehealth`: Enable video consultations
- `enableMedicalRecords`: Show medical records section
- `enablePrescriptionRefills`: Allow prescription refill requests
- `enableAppointmentRescheduling`: Allow patients to reschedule

**Indexes**:
- Unique: `{ flagKey: 1 }`
- `{ enabled: 1 }` - Quick active flags lookup

---

## 10. API Specifications

### 10.1 Authentication Endpoints (PLANNED - NOT IMPLEMENTED)

#### POST /api/auth/register
**Description**: Register a new user account  
**Authentication**: None  
**Request Body**:
```json
{
  "email": "patient@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient",
  "phone": "555-1234",
  "dateOfBirth": "1990-01-15"
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "userId": "P1234567890",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Errors**:
- 400: Validation error (email format, password strength)
- 409: Email already exists

---

#### POST /api/auth/login
**Description**: Authenticate user and receive JWT token  
**Authentication**: None  
**Request Body**:
```json
{
  "email": "doctor@example.com",
  "password": "DoctorPass123!"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "userId": "D1234567890",
    "email": "doctor@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "doctor",
    "specialty": "Cardiology",
    "permissions": {
      "canPrescribe": true,
      "canAccessMedicalRecords": true
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Errors**:
- 400: Missing email or password
- 401: Invalid credentials
- 403: Account inactive or suspended

---

#### POST /api/auth/logout
**Description**: Invalidate user session  
**Authentication**: Required (JWT)  
**Headers**: `Authorization: Bearer <token>`  
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /api/auth/forgot-password
**Description**: Request password reset email  
**Authentication**: None  
**Request Body**:
```json
{
  "email": "patient@example.com"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

---

#### POST /api/auth/reset-password
**Description**: Reset password with token  
**Authentication**: None  
**Request Body**:
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Password reset successful"
}
```
**Errors**:
- 400: Invalid or expired token
- 400: Password does not meet requirements

---

### 10.2 User Management Endpoints (PLANNED - NOT IMPLEMENTED)

#### GET /api/users
**Description**: Get all users (admin only)  
**Authentication**: Required (JWT) - Admin role  
**Query Parameters**:
- `role`: Filter by role (patient, doctor, nurse, admin)
- `status`: Filter by status (active, inactive, suspended)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 50)
- `search`: Search by name or email

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "P1234567890",
        "email": "patient@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "patient",
        "status": "active",
        "lastLogin": "2025-12-07T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "pages": 3
    }
  }
}
```

---

#### GET /api/users/:userId
**Description**: Get user details by ID  
**Authentication**: Required (JWT) - Own profile or admin  
**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "userId": "P1234567890",
    "email": "patient@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient",
    "phone": "555-1234",
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zipCode": "12345"
    },
    "dateOfBirth": "1990-01-15",
    "bloodType": "O+",
    "allergies": [
      {
        "allergen": "Penicillin",
        "reaction": "Rash",
        "severity": "moderate"
      }
    ],
    "insurance": {
      "provider": "Blue Cross",
      "policyNumber": "BC123456",
      "planType": "gold"
    }
  }
}
```
**Errors**:
- 404: User not found
- 403: Not authorized to view this user

---

#### PUT /api/users/:userId
**Description**: Update user information  
**Authentication**: Required (JWT) - Own profile or admin  
**Request Body** (partial update allowed):
```json
{
  "phone": "555-9999",
  "address": {
    "street": "456 Oak Ave",
    "city": "Newtown",
    "state": "CA",
    "zipCode": "54321"
  }
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": { /* updated user object */ }
}
```

---

#### DELETE /api/users/:userId
**Description**: Deactivate user account  
**Authentication**: Required (JWT) - Admin only  
**Request Body**:
```json
{
  "reason": "Resigned"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

### 10.3 Messaging Endpoints (IMPLEMENTED)

#### GET /api/messages/providers
**Description**: Get list of available healthcare providers  
**Authentication**: Required (JWT)  
**Response** (200 OK):
```json
{
  "providers": [
    {
      "_id": "D1234567890",
      "name": "Dr. Sarah Smith",
      "role": "doctor",
      "specialty": "Cardiology"
    },
    {
      "_id": "N9876543210",
      "name": "Nurse John Wilson",
      "role": "nurse",
      "department": "Emergency"
    }
  ]
}
```

---

#### GET /api/messages/conversations/:userId
**Description**: Get all conversations for a user with unread counts  
**Authentication**: Required (JWT)  
**Response** (200 OK):
```json
{
  "conversations": [
    {
      "conversationId": "P123_D456",
      "otherUser": {
        "id": "D1234567890",
        "name": "Dr. Sarah Smith",
        "role": "doctor"
      },
      "lastMessage": "Your test results are ready",
      "lastMessageTime": "2025-12-07T15:30:00Z",
      "unreadCount": 2
    }
  ]
}
```

---

#### GET /api/messages/messages/:userId/:recipientId
**Description**: Get all messages in a conversation between two users  
**Authentication**: Required (JWT)  
**Response** (200 OK):
```json
{
  "messages": [
    {
      "_id": "msg001",
      "conversationId": "P123_D456",
      "senderId": "P1234567890",
      "senderName": "John Doe",
      "senderRole": "patient",
      "recipientId": "D1234567890",
      "recipientName": "Dr. Sarah Smith",
      "recipientRole": "doctor",
      "message": "I have questions about my prescription",
      "read": true,
      "messageType": "text",
      "priority": "normal",
      "createdAt": "2025-12-07T14:00:00Z"
    }
  ]
}
```

---

#### POST /api/messages/send
**Description**: Send a new message  
**Authentication**: Required (JWT)  
**Request Body**:
```json
{
  "senderId": "P1234567890",
  "senderName": "John Doe",
  "senderRole": "patient",
  "recipientId": "D1234567890",
  "recipientName": "Dr. Sarah Smith",
  "recipientRole": "doctor",
  "message": "When should I take my medication?",
  "messageType": "prescription",
  "priority": "normal",
  "relatedPrescriptionId": "RX12345"
}
```
**Response** (201 Created):
```json
{
  "message": "Message sent successfully",
  "messageId": "msg002",
  "conversationId": "P123_D456"
}
```
**Note**: Triggers auto-response after 2 seconds if sender is patient

---

#### PUT /api/messages/read/:userId/:senderId
**Description**: Mark all messages from sender as read  
**Authentication**: Required (JWT)  
**Response** (200 OK):
```json
{
  "message": "Messages marked as read",
  "count": 3
}
```

---

#### GET /api/messages/unread/:userId
**Description**: Get count of unread messages for user  
**Authentication**: Required (JWT)  
**Response** (200 OK):
```json
{
  "unreadCount": 5
}
```

---

### 10.4 Appointment Endpoints (PLANNED - NOT IMPLEMENTED)

#### GET /api/appointments
**Description**: Get appointments (filtered by user role)  
**Authentication**: Required (JWT)  
**Query Parameters**:
- `patientId`: Filter by patient (for admins/doctors)
- `doctorId`: Filter by doctor
- `status`: Filter by status
- `date`: Filter by date (YYYY-MM-DD)
- `startDate` & `endDate`: Date range

**Response** (200 OK):
```json
{
  "success": true,
  "appointments": [
    {
      "appointmentId": "APT12345",
      "patientName": "John Doe",
      "doctorName": "Dr. Sarah Smith",
      "appointmentType": "Telehealth",
      "preferredDate": "2025-12-10",
      "preferredTime": "10:00 AM",
      "status": "confirmed",
      "priority": "normal",
      "chiefComplaint": "Follow-up on blood pressure"
    }
  ]
}
```

---

#### POST /api/appointments
**Description**: Create new appointment  
**Authentication**: Required (JWT)  
**Request Body**:
```json
{
  "patientId": "P1234567890",
  "appointmentType": "Telehealth",
  "preferredDate": "2025-12-15",
  "preferredTime": "2:00 PM",
  "chiefComplaint": "Persistent headache",
  "doctorId": "D1234567890"
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "message": "Appointment created successfully",
  "appointment": {
    "appointmentId": "APT67890",
    "status": "pending",
    /* ... appointment details ... */
  }
}
```

---

#### PUT /api/appointments/:appointmentId
**Description**: Update appointment (reschedule, change status, etc.)  
**Authentication**: Required (JWT)  
**Request Body**:
```json
{
  "status": "confirmed",
  "preferredDate": "2025-12-16",
  "preferredTime": "3:00 PM"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Appointment updated successfully",
  "appointment": { /* updated appointment */ }
}
```

---

#### DELETE /api/appointments/:appointmentId
**Description**: Cancel appointment  
**Authentication**: Required (JWT)  
**Request Body**:
```json
{
  "cancellationReason": "Patient unavailable"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

---

### 10.5 Prescription Endpoints (PLANNED - NOT IMPLEMENTED)

#### GET /api/prescriptions
**Description**: Get prescriptions (patient sees own, doctors see their prescribed)  
**Authentication**: Required (JWT)  
**Query Parameters**:
- `patientId`: Filter by patient
- `status`: Filter by status
- `activeOnly`: Boolean to show only active prescriptions

**Response** (200 OK):
```json
{
  "success": true,
  "prescriptions": [
    {
      "prescriptionId": "RX12345",
      "medication": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "refillsRemaining": 2,
      "status": "active",
      "doctorName": "Dr. Sarah Smith",
      "datePrescribed": "2025-11-01"
    }
  ]
}
```

---

#### POST /api/prescriptions
**Description**: Write new prescription (doctors only)  
**Authentication**: Required (JWT) - Doctor with canPrescribe permission  
**Request Body**:
```json
{
  "patientId": "P1234567890",
  "medication": "Amoxicillin",
  "dosage": "500mg",
  "frequency": "Three times daily",
  "quantity": 30,
  "refills": 0,
  "instructions": "Take with food. Complete full course even if feeling better.",
  "relatedAppointmentId": "APT12345"
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "message": "Prescription created successfully",
  "prescription": {
    "prescriptionId": "RX67890",
    /* ... prescription details ... */
  }
}
```

---

#### POST /api/prescriptions/:prescriptionId/refill
**Description**: Request prescription refill  
**Authentication**: Required (JWT) - Patient  
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Refill request submitted successfully",
  "refillsRemaining": 1
}
```
**Errors**:
- 400: No refills remaining
- 404: Prescription not found

---

### 10.6 Lab Results Endpoints (PLANNED - NOT IMPLEMENTED)

#### GET /api/lab-results
**Description**: Get lab results (patients see own, doctors see their ordered/reviewed)  
**Authentication**: Required (JWT)  
**Query Parameters**:
- `patientId`: Filter by patient
- `reviewStatus`: Filter by review status

**Response** (200 OK):
```json
{
  "success": true,
  "labResults": [
    {
      "labResultId": "LAB12345",
      "testName": "Complete Blood Count",
      "resultDate": "2025-12-05",
      "reviewStatus": "reviewed",
      "criticalResult": false,
      "resultsSummary": "All values within normal range"
    }
  ]
}
```

---

#### PUT /api/lab-results/:labResultId/review
**Description**: Mark lab result as reviewed (doctors only)  
**Authentication**: Required (JWT) - Doctor  
**Request Body**:
```json
{
  "interpretation": "Results indicate patient is responding well to treatment",
  "reviewNotes": "Continue current medication"
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Lab result reviewed successfully"
}
```

---

### 10.7 System Endpoints (IMPLEMENTED)

#### GET /api/health
**Description**: Health check endpoint for monitoring  
**Authentication**: None  
**Response** (200 OK):
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 86400,
  "timestamp": "2025-12-07T18:00:00Z"
}
```

---

#### GET /
**Description**: Root endpoint - serves frontend  
**Authentication**: None  
**Response**: Serves index.html with React application

---

### 10.8 Admin Endpoints (PLANNED - NOT IMPLEMENTED)

#### GET /api/admin/users/stats
**Description**: Get user statistics  
**Authentication**: Required (JWT) - Admin  
**Response** (200 OK):
```json
{
  "totalUsers": 1250,
  "byRole": {
    "patient": 1000,
    "doctor": 150,
    "nurse": 90,
    "admin": 10
  },
  "byStatus": {
    "active": 1200,
    "inactive": 40,
    "suspended": 10
  },
  "newUsersThisMonth": 45
}
```

---

#### GET /api/admin/feature-flags
**Description**: Get all feature flags  
**Authentication**: Required (JWT) - Admin  
**Response** (200 OK):
```json
{
  "featureFlags": [
    {
      "flagKey": "enableChat",
      "enabled": true,
      "enabledForRoles": ["all"]
    },
    {
      "flagKey": "enableTelehealth",
      "enabled": true,
      "enabledForRoles": ["doctor", "patient"]
    }
  ]
}
```

---

#### PUT /api/admin/feature-flags/:flagKey
**Description**: Toggle feature flag  
**Authentication**: Required (JWT) - Admin  
**Request Body**:
```json
{
  "enabled": false
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "message": "Feature flag updated",
  "flag": {
    "flagKey": "enableChat",
    "enabled": false
  }
}
```

---

#### GET /api/admin/audit-logs
**Description**: Get audit logs for compliance  
**Authentication**: Required (JWT) - Admin  
**Query Parameters**:
- `userId`: Filter by user
- `actionType`: Filter by action type
- `startDate` & `endDate`: Date range
- `phiAccessed`: Boolean to filter PHI access

**Response** (200 OK):
```json
{
  "success": true,
  "logs": [
    {
      "logId": "LOG12345",
      "userId": "D1234567890",
      "userName": "Dr. Sarah Smith",
      "action": "Viewed patient medical record",
      "actionType": "read",
      "targetType": "patient",
      "targetId": "P1234567890",
      "phiAccessed": true,
      "timestamp": "2025-12-07T14:30:00Z",
      "ipAddress": "192.168.1.100"
    }
  ]
}
```

---

## 11. Security & Compliance

### 11.1 Authentication & Authorization

**Authentication Mechanism**:
- JWT (JSON Web Tokens) for stateless authentication
- Token structure: Header.Payload.Signature using HS256 algorithm
- Token expiration: Configurable (recommended: 24 hours for normal, 1 hour for sensitive operations)
- Refresh token mechanism for extended sessions
- Secure token storage: HttpOnly cookies or secure client storage

**Password Security**:
- Bcrypt hashing with salt rounds (minimum: 10)
- Password requirements enforced:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
- Password history: Prevent reuse of last 5 passwords
- Account lockout after 5 failed login attempts
- Password reset via secure email token (expires in 1 hour)

**Authorization**:
- Role-Based Access Control (RBAC) - See Section 6.2 for permission matrix
- Middleware validation on all protected endpoints
- Permission checks at both API and UI levels
- Principle of least privilege enforced

### 11.2 Data Protection

**Encryption in Transit**:
- HTTPS/TLS 1.2+ enforced for all communications
- SSL certificate from trusted Certificate Authority
- HSTS (HTTP Strict Transport Security) headers
- Secure WebSocket connections (WSS) for real-time features

**Encryption at Rest**:
- MongoDB Atlas automatic encryption at rest
- Field-level encryption for highly sensitive data (SSN, credit cards if stored)
- Encrypted backups

**Data Sanitization**:
- Input validation on all user-submitted data
- SQL/NoSQL injection prevention via Mongoose ODM
- XSS (Cross-Site Scripting) prevention via React automatic escaping
- CSRF (Cross-Site Request Forgery) tokens for state-changing operations

**Sensitive Data Handling**:
- PHI (Protected Health Information) encrypted at field level
- Minimum necessary access principle
- Data masking in logs (no passwords, tokens, or PHI in application logs)
- Secure credential storage in environment variables (never in code)

### 11.3 HIPAA Compliance

**Administrative Safeguards**:
- Security officer designated (required)
- Workforce clearance procedures
- Information access management (see permission matrix Section 6.2)
- Security awareness training for all users
- Security incident procedures and response plan
- Business Associate Agreements (BAAs) with all vendors:
  - MongoDB Atlas (database)
  - CloudLinux Passenger (hosting)
  - Email service provider
  - SMS provider (Twilio)
  - Video conferencing platform

**Physical Safeguards**:
- Facility access controls (vendor responsibility for cloud infrastructure)
- Workstation security policies
- Device and media controls

**Technical Safeguards**:
- Access control: Unique user identification (userId), automatic logoff after inactivity
- Audit controls: Comprehensive audit logging (see Section 9.7 AuditLog model)
- Integrity controls: Data validation, checksums for file uploads
- Transmission security: HTTPS/TLS encryption

**Audit Logging Requirements**:
- Log all access to PHI (patient demographics, medical records, prescriptions, lab results, messages)
- Track user authentication events (login, logout, failed attempts)
- Record administrative actions (user creation, permission changes, system settings)
- Immutable logs retained for 7 years (HIPAA minimum: 6 years)
- Regular audit log reviews for suspicious activity

**Patient Rights**:
- Right to access own health information
- Right to request amendments to records
- Right to accounting of disclosures
- Right to request restrictions on uses/disclosures
- Right to request confidential communications
- Privacy Notice provided to all patients

**Breach Notification**:
- Detection and investigation procedures
- Notification within 60 days of discovery
- HHS (Department of Health and Human Services) reporting for breaches affecting 500+ individuals
- Individual notification via email or mail
- Incident documentation and remediation

### 11.4 Session Management

**Session Security**:
- Secure, random session identifiers (JWT with cryptographically random secrets)
- Session timeout after 30 minutes of inactivity (configurable)
- Absolute session timeout after 24 hours
- Re-authentication required for sensitive operations (e.g., viewing medical records, changing password)
- Session invalidation on logout
- Concurrent session management (limit: 3 active sessions per user)

**Token Management**:
- JWT secret stored in environment variable (minimum 256-bit)
- Token refresh mechanism for seamless user experience
- Token revocation list for compromised tokens
- Device fingerprinting for session validation

### 11.5 API Security

**CORS (Cross-Origin Resource Sharing)**:
- Whitelist allowed origins:
  - Production: https://henrydjorgee.com
  - Development: http://localhost:3000
- Restrict HTTP methods: GET, POST, PUT, DELETE (no TRACE, OPTIONS exposed)
- Credentials allowed only for whitelisted origins

**Rate Limiting**:
- General API: 100 requests per 15 minutes per IP
- Authentication endpoints: 5 login attempts per 15 minutes per IP
- Messaging endpoints: 30 messages per hour per user
- 429 Too Many Requests response when exceeded

**Input Validation**:
- Schema validation for all request bodies (using Mongoose schemas)
- Type checking and sanitization
- File upload restrictions:
  - Allowed types: PDF, JPG, PNG, DOC, DOCX
  - Maximum size: 10MB per file
  - Virus scanning on uploads
- SQL/NoSQL injection prevention via parameterized queries
- Command injection prevention

**Error Handling**:
- Generic error messages to clients (no stack traces in production)
- Detailed error logging server-side
- Error codes standardized:
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (authentication failure)
  - 403: Forbidden (authorization failure)
  - 404: Not Found
  - 429: Too Many Requests
  - 500: Internal Server Error (generic, no details exposed)

### 11.6 Infrastructure Security

**Server Security**:
- CloudLinux Passenger with security updates
- Firewall configuration (only ports 80, 443 open)
- Regular security patches and updates
- Intrusion detection/prevention system (IDS/IPS)
- DDoS protection

**Database Security**:
- MongoDB Atlas with IP whitelisting
- Database user with least privilege (application user cannot drop database)
- Connection string secured in environment variables
- Regular automated backups (MongoDB Atlas handles this)
- Encryption at rest enabled

**Dependency Security**:
- Regular dependency audits (`npm audit`)
- Automated security vulnerability scanning
- Timely updates for critical security patches
- Dependency pinning in package.json to prevent supply chain attacks

### 11.7 Monitoring & Incident Response

**Security Monitoring**:
- Real-time alerts for:
  - Multiple failed login attempts
  - Unusual access patterns (e.g., accessing 100+ patient records in short time)
  - Database connection failures
  - Unexpected errors (500 errors spike)
  - PHI access outside normal hours
- Health check endpoint monitoring: /api/health
- Database connection status monitoring

**Incident Response Plan**:
1. **Detection**: Automated alerts, user reports, audit log reviews
2. **Containment**: Disable compromised accounts, block malicious IPs
3. **Investigation**: Review audit logs, identify scope of breach
4. **Eradication**: Patch vulnerabilities, reset compromised credentials
5. **Recovery**: Restore systems, verify integrity
6. **Lessons Learned**: Document incident, update security policies

**Backup & Disaster Recovery**:
- Automated daily backups (MongoDB Atlas)
- Point-in-time recovery capability
- Backup retention: 7 days (configurable)
- Disaster recovery plan with RTO (Recovery Time Objective) of 4 hours, RPO (Recovery Point Objective) of 1 hour
- Quarterly disaster recovery drills

---

## 12. Integration & Dependencies

### 12.1 Current Integrations

**MongoDB Atlas (ACTIVE)**:
- Purpose: Cloud database for all persistent data
- Connection: Via connection string in .env
- Configuration:
  - Cluster: cluster0.evocwwj.mongodb.net
  - Database User: hdjorgee_db_user
  - Connection pooling: min 2, max 10 connections
  - Auto-reconnection with exponential backoff (max 5 retries)
- Dependencies: mongoose@7.5.0
- Backup: Automated by MongoDB Atlas
- Monitoring: Connection status via /api/health endpoint
- Security: TLS encryption, IP whitelisting, user authentication

**CloudLinux Passenger (ACTIVE)**:
- Purpose: Application server for Node.js deployment
- Configuration: Passenger handles process management, load balancing
- Domain: henrydjorgee.com
- HTTPS: Enforced via SSL certificate
- Deployment: Git-based or FTP deployment

**Express.js Framework (ACTIVE)**:
- Purpose: Web application framework for REST API
- Version: 4.18.2
- Features used:
  - Routing
  - Middleware (CORS, body-parser, authentication)
  - Error handling
  - Static file serving
- Dependencies: express@4.18.2, cors@2.8.5

**React Framework (ACTIVE)**:
- Purpose: Frontend UI framework
- Version: 19.1.1
- Build: Compiled to static files in /static directory
- UI Library: React-Bootstrap for responsive components
- State Management: LocalStorage for mock data, future: Redux/Context API
- Routing: React Router (assumed, typical for multi-dashboard app)

### 12.2 Planned Integrations

**Socket.IO (INSTALLED, NOT ACTIVE)**:
- Purpose: Real-time bidirectional communication for live chat and notifications
- Version: 4.5.2
- Status: Installed in package.json, not implemented in code
- Use Cases:
  - Real-time messaging between patients and providers
  - Live notifications for new appointments, prescriptions, lab results
  - Provider availability status
  - Typing indicators in chat
- Implementation Requirements:
  - Server-side: Socket.IO server setup in server.js
  - Client-side: Socket.IO client connection
  - Authentication: JWT verification for socket connections
  - Event handlers: message, notification, status-update
- Security: Secure WebSocket (WSS), authentication required

**Email Service (CONFIGURED, NOT ACTIVE)**:
- Purpose: Send transactional emails
- Status: Placeholder in .env, not implemented
- Use Cases:
  - Welcome emails for new users
  - Password reset emails
  - Appointment confirmation/reminder emails
  - Prescription ready notifications
  - Lab result availability alerts
  - System broadcast announcements
- Recommended Provider: SendGrid, AWS SES, or Mailgun
- Implementation Requirements:
  - Email service API key in .env
  - Email templates (HTML + plain text)
  - Nodemailer library for sending
  - Queue system for bulk emails (e.g., Bull with Redis)
- Compliance: CAN-SPAM Act compliance, unsubscribe mechanism

**Twilio SMS (CONFIGURED, NOT ACTIVE)**:
- Purpose: Send SMS notifications
- Status: Placeholder in .env, not implemented
- Use Cases:
  - Appointment reminders (24 hours before)
  - Prescription ready for pickup
  - Critical lab results alerts
  - Two-factor authentication codes
  - Emergency notifications
- Requirements:
  - Twilio Account SID and Auth Token
  - Phone number registration
  - SMS templates
  - Opt-in/opt-out management
- Implementation: Twilio SDK (twilio@^4.0.0)
- Compliance: TCPA compliance, opt-in required, HIPAA-compliant Twilio account (BAA required)

**Video Conferencing Platform (PLANNED)**:
- Purpose: Telehealth video consultations
- Status: Not implemented (meeting URLs generated as placeholders)
- Use Cases:
  - Doctor-patient video appointments
  - Multi-party consultations (doctor, patient, specialist)
  - Screen sharing for medical images review
- Recommended Providers:
  - Twilio Video (HIPAA-compliant)
  - Zoom Healthcare API (with BAA)
  - Doxy.me (HIPAA-compliant, healthcare-focused)
  - Agora.io
- Requirements:
  - Provider API keys
  - Session creation/management
  - Recording capability (with consent)
  - Waiting room feature
  - Mobile app support
- Security: End-to-end encryption, HIPAA BAA required

**File Storage (PLANNED)**:
- Purpose: Store medical documents, lab results, prescription images
- Status: Not implemented (attachments field exists in Message model)
- Use Cases:
  - Lab result PDFs
  - Prescription images
  - Medical record attachments
  - Profile pictures
- Recommended Providers:
  - AWS S3 (HIPAA-eligible with BAA)
  - Azure Blob Storage (HIPAA-compliant)
  - Google Cloud Storage (HIPAA-compliant tier)
- Requirements:
  - Bucket/container creation
  - Pre-signed URLs for secure download
  - File type validation
  - Virus scanning on upload
  - Retention policies
- Implementation: AWS SDK or cloud provider SDK

**Payment Gateway (FUTURE)**:
- Purpose: Process copayments, subscription fees
- Use Cases:
  - Appointment copay collection
  - Prescription copay payment
  - Subscription plans (premium features)
  - Telemedicine consultation fees
- Recommended Providers:
  - Stripe (PCI-compliant)
  - Square
  - Authorize.net
- Requirements:
  - PCI DSS compliance (use hosted payment forms to minimize compliance burden)
  - Integration with insurance verification
  - Receipt generation
  - Refund handling

**Insurance Verification API (FUTURE)**:
- Purpose: Real-time insurance eligibility checking
- Use Cases:
  - Verify patient insurance at registration
  - Check coverage for procedures
  - Update insurance expiration dates
- Providers:
  - Availity
  - Change Healthcare
  - PokitDok (Dokomo Health)
- Requirements: Provider API credentials, integration with User model insurance fields

**Electronic Health Records (EHR) Integration (FUTURE)**:
- Purpose: Interoperability with external EHR systems
- Standards:
  - HL7 FHIR (Fast Healthcare Interoperability Resources)
  - CCD (Continuity of Care Document)
- Use Cases:
  - Import patient history from other providers
  - Export patient records for referrals
  - Lab result integration
- Providers: Epic, Cerner, Allscripts integration APIs
- Requirements: HL7 FHIR server, data mapping, SMART on FHIR authorization

### 12.3 Third-Party Dependencies

**Backend Dependencies** (package.json):
- express@4.18.2 - Web framework
- mongoose@7.5.0 - MongoDB ODM
- jsonwebtoken@9.0.2 - JWT authentication
- bcryptjs@2.4.3 - Password hashing
- cors@2.8.5 - Cross-origin resource sharing
- dotenv@16.3.1 - Environment variables
- socket.io@4.5.2 - Real-time communication (installed, not active)

**Frontend Dependencies**:
- react@19.1.1 - UI framework
- react-dom@19.1.1 - React DOM rendering
- react-bootstrap - Bootstrap components for React
- axios (assumed) - HTTP client for API calls
- react-router-dom (assumed) - Client-side routing

**Development Dependencies**:
- nodemon - Auto-restart server during development
- ESLint (recommended) - Code linting
- Jest (recommended) - Unit testing
- Supertest (recommended) - API endpoint testing

### 12.4 External Services

**Domain & DNS**:
- Domain: henrydjorgee.com
- DNS Provider: (to be determined based on domain registrar)
- SSL Certificate: Let's Encrypt or commercial CA

**Monitoring & Analytics** (Recommended):
- Application Performance Monitoring: New Relic, Datadog, or Application Insights
- Error Tracking: Sentry or Rollbar
- Usage Analytics: Google Analytics (with HIPAA considerations, anonymize IP)
- Uptime Monitoring: Pingdom, UptimeRobot

**Development & CI/CD** (Recommended):
- Version Control: GitHub/GitLab
- CI/CD Pipeline: GitHub Actions, GitLab CI, or Jenkins
- Code Quality: SonarQube, CodeClimate
- Dependency Scanning: Snyk, Dependabot

---

## 13. Assumptions, Constraints & Risks

### 13.1 Assumptions

**User Behavior Assumptions**:
- Users have reliable internet connectivity (minimum 5 Mbps for video consultations)
- Users have access to modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Patients will provide accurate personal and medical information
- Healthcare providers will respond to patient messages within 24-48 hours
- Users will maintain password security and not share credentials

**Technical Assumptions**:
- MongoDB Atlas will maintain 99.9% uptime per SLA
- CloudLinux Passenger deployment environment will remain available and supported
- React 19.1.1 and Express 4.18.2 will not have breaking changes during active development
- Internet bandwidth sufficient for WebSocket connections and video streaming
- Mobile device usage will increase, requiring responsive design

**Business Assumptions**:
- Regulatory compliance (HIPAA) requirements will not change significantly during development
- Healthcare providers will adopt the platform for patient communication
- Patients prefer digital communication over phone calls for non-urgent matters
- Insurance verification can be handled manually initially
- Market demand for telehealth services will continue growing

**Timeline Assumptions**:
- Development can proceed incrementally with MVP (messaging, appointments, prescriptions) first
- Feature flags allow gradual rollout of new features
- User acceptance testing will occur before production release
- Adequate time for security audits and HIPAA compliance reviews

### 13.2 Constraints

**Technical Constraints**:
- CloudLinux Passenger deployment environment (cannot use certain Node.js features or architectures)
- MongoDB Atlas free/paid tier limitations (storage, connection limits)
- Single database instance (no sharding initially)
- React static build deployment (no server-side rendering)
- No containerization (Docker/Kubernetes) on current hosting
- IPv4 networking (MongoDB Atlas IP whitelist required)

**Resource Constraints**:
- Development team size (impacts delivery timeline)
- Budget for third-party services (Twilio, video platform, email service)
- Server resources (CPU, memory, bandwidth) per hosting plan
- Database storage limits per MongoDB Atlas tier
- Concurrent connection limits (max 10 with current pooling config)

**Regulatory Constraints**:
- HIPAA compliance requirements (affects architecture, logging, data handling)
- State-specific telehealth regulations (licensing, prescribing across state lines)
- Data residency requirements (data must stay in US for some compliance)
- Patient consent requirements before sharing PHI
- Mandatory breach notification timelines (60 days)
- Audit log retention (minimum 6-7 years)

**Security Constraints**:
- HTTPS required (no HTTP access)
- Password complexity requirements may frustrate some users
- Session timeout for security may interrupt user workflows
- MFA (multi-factor authentication) may be required for providers (constraint on UX)
- File upload size restrictions (10MB limit)

**Integration Constraints**:
- Dependency on third-party API availability and uptime
- Rate limits from external services (Twilio, email providers)
- API version deprecation by vendors
- Cost per API call for premium services
- Data format compatibility with external EHR systems

**Business Constraints**:
- Budget limits for infrastructure and third-party services
- Timeline for MVP vs full feature set
- Staffing for customer support and training
- Marketing reach to acquire users
- Competition from established telehealth platforms

### 13.3 Risks

**Security Risks**:
- **Risk**: Data breach exposing PHI  
  **Impact**: High - HIPAA penalties, lawsuits, reputation damage  
  **Probability**: Medium  
  **Mitigation**: Encryption, access controls, audit logging, security audits, penetration testing, incident response plan

- **Risk**: Unauthorized access to patient records  
  **Impact**: High - Privacy violation, compliance issues  
  **Probability**: Medium  
  **Mitigation**: Strong authentication (JWT), role-based access control, MFA for providers, session management, audit logs

- **Risk**: SQL/NoSQL injection attacks  
  **Impact**: High - Data corruption, unauthorized access  
  **Probability**: Low (with Mongoose ODM)  
  **Mitigation**: Parameterized queries via Mongoose, input validation, security code reviews

- **Risk**: DDoS attacks causing service outage  
  **Impact**: Medium - Service unavailability  
  **Probability**: Medium  
  **Mitigation**: Rate limiting, DDoS protection (CloudFlare, AWS Shield), load balancing

**Compliance Risks**:
- **Risk**: HIPAA violation due to improper PHI handling  
  **Impact**: High - Fines ($100-$50,000 per violation), legal action  
  **Probability**: Medium  
  **Mitigation**: Comprehensive audit logging, staff training, privacy policies, BAAs with vendors, regular compliance audits

- **Risk**: Failure to obtain patient consent for data sharing  
  **Impact**: Medium - Legal liability, trust issues  
  **Probability**: Low  
  **Mitigation**: Consent forms during registration, clear privacy notices, opt-in for communications

- **Risk**: Audit log tampering or loss  
  **Impact**: High - Compliance failure, inability to investigate incidents  
  **Probability**: Low  
  **Mitigation**: Immutable logs (append-only), separate audit log database/service, regular backups

**Technical Risks**:
- **Risk**: Database connection failures  
  **Impact**: High - Service outage  
  **Probability**: Low (with auto-reconnection)  
  **Mitigation**: Connection pooling, auto-reconnection logic (implemented), health monitoring, failover database

- **Risk**: Third-party service outage (MongoDB Atlas, Twilio, etc.)  
  **Impact**: Medium-High - Partial or full service disruption  
  **Probability**: Low  
  **Mitigation**: Service SLA monitoring, graceful degradation, fallback mechanisms, multi-vendor strategy for critical services

- **Risk**: Dependency vulnerabilities (npm packages)  
  **Impact**: Medium-High - Security exploits  
  **Probability**: Medium  
  **Mitigation**: Regular `npm audit`, automated security scanning, timely updates, dependency pinning

- **Risk**: Scalability issues under high load  
  **Impact**: Medium - Poor user experience, service slowdown  
  **Probability**: Medium  
  **Mitigation**: Connection pooling, horizontal scaling capability, load testing, caching, database indexing

- **Risk**: Data loss due to hardware failure or disaster  
  **Impact**: High - Loss of patient data  
  **Probability**: Low (with cloud provider)  
  **Mitigation**: Automated backups (MongoDB Atlas), point-in-time recovery, disaster recovery plan, backup testing

**Operational Risks**:
- **Risk**: Insufficient user adoption  
  **Impact**: High - Business failure  
  **Probability**: Medium  
  **Mitigation**: User-friendly UI, training materials, customer support, marketing, pilot program with early adopters

- **Risk**: Provider resistance to new technology  
  **Impact**: Medium - Low usage by doctors/nurses  
  **Probability**: Medium  
  **Mitigation**: Provider training, demonstrate time savings, integration with existing workflows, champion advocates

- **Risk**: Inadequate customer support  
  **Impact**: Medium - User frustration, churn  
  **Probability**: Medium  
  **Mitigation**: Comprehensive user manuals per role, FAQs, help desk, in-app support chat

- **Risk**: Feature creep delaying MVP launch  
  **Impact**: Medium - Extended timeline, budget overrun  
  **Probability**: High  
  **Mitigation**: Strict prioritization, feature flag system (implemented), phased rollout, MVP definition

**Integration Risks**:
- **Risk**: EHR integration complexity and delays  
  **Impact**: Medium - Delayed interoperability features  
  **Probability**: High  
  **Mitigation**: Standard APIs (HL7 FHIR), phased integration approach, vendor support, adequate development time

- **Risk**: Video platform reliability issues  
  **Impact**: High - Failed telehealth appointments  
  **Probability**: Medium  
  **Mitigation**: Choose proven HIPAA-compliant provider (Twilio Video, Zoom Healthcare), fallback to phone, SLA monitoring

- **Risk**: Payment gateway integration failures  
  **Impact**: Medium - Lost revenue, poor user experience  
  **Probability**: Low  
  **Mitigation**: Robust error handling, transaction logging, customer support for payment issues, testing

---

## 14. Future Enhancements & Roadmap

### 14.1 Phase 1 Enhancements (3-6 months)

**Real-Time Chat (Socket.IO Implementation)**:
- Activate installed Socket.IO for live messaging
- Replace polling with WebSocket connections
- Typing indicators
- Message delivery and read receipts
- Online/offline provider status
- Push notifications for new messages
- Group chat for care teams (doctor + nurse + patient)

**Email Notifications**:
- Implement email service integration (SendGrid/AWS SES)
- Welcome emails for new users
- Password reset emails
- Appointment confirmation emails
- Prescription ready notifications
- Daily digest of unread messages for providers
- Customizable email templates

**SMS Notifications**:
- Integrate Twilio for SMS
- Appointment reminders (24 hours before)
- Prescription ready alerts
- Critical lab result notifications
- Two-factor authentication (2FA) codes
- Opt-in/opt-out management per user preferences

**Enhanced Reporting**:
- Provider performance dashboards (patients seen, avg response time)
- Patient engagement metrics (login frequency, message activity)
- Appointment analytics (cancellation rates, no-show rates, most booked types)
- Prescription trends
- Exportable reports (PDF, Excel)

**Mobile Optimization**:
- Progressive Web App (PWA) capabilities
- Offline mode for viewing cached data
- Push notifications on mobile
- Touch-optimized UI improvements
- Mobile-specific navigation patterns

### 14.2 Phase 2 Enhancements (6-12 months)

**Video Consultations**:
- Integrate HIPAA-compliant video platform (Twilio Video or Zoom Healthcare)
- Waiting room feature for patients
- Screen sharing for reviewing medical images
- Consultation recording (with consent)
- Post-visit notes attached to appointment
- Mobile app support for video calls
- Multi-party consultations (patient + primary doctor + specialist)

**Advanced Prescription Management**:
- E-prescribing integration with pharmacies (Surescripts, DrFirst)
- Drug interaction warnings
- Allergy alerts when prescribing
- Formulary checking (insurance coverage for medications)
- Controlled substance prescribing (with DEA compliance)
- Prescription history from external pharmacies

**Lab Results Integration**:
- HL7 integration with lab systems
- Automatic import of lab results
- Critical value alerts to doctors
- Lab trending graphs for patients
- Comparison with previous results
- PDF report generation

**Appointment Scheduling Enhancements**:
- Calendar view for doctors (day, week, month views)
- Drag-and-drop rescheduling
- Recurring appointments
- Group appointments (e.g., support groups)
- Waitlist management for cancelled slots
- Provider availability settings (block time, vacation)
- Automated appointment reminders (email + SMS)

**Enhanced Medical Records**:
- Complete EHR module:
  - Problem list (active diagnoses)
  - Allergy management
  - Medication reconciliation
  - Immunization records
  - Vital signs trending
  - Growth charts (pediatrics)
  - Social history (smoking, alcohol, exercise)
  - Family history
- CCDA (Consolidated Clinical Document Architecture) export
- Import records from external providers
- Document scanner integration

### 14.3 Phase 3 Enhancements (12-24 months)

**Native Mobile Applications**:
- iOS app (Swift/SwiftUI)
- Android app (Kotlin)
- React Native cross-platform app (alternative approach)
- Biometric authentication (Face ID, Touch ID, fingerprint)
- Location-based services (find nearby providers)
- Camera integration (upload documents, telemedicine)
- App store deployment

**Artificial Intelligence & Machine Learning**:
- Symptom checker chatbot for triage
- Predictive analytics for patient no-shows
- Natural language processing for medical notes
- Medication adherence predictions
- Risk stratification for chronic disease patients
- Intelligent appointment scheduling (suggest best times)

**Payment & Billing**:
- Integrated payment gateway (Stripe, Square)
- Copay collection at appointment booking
- Subscription plans (premium features for patients)
- Provider billing module (track revenue, generate invoices)
- Insurance claims submission (integration with clearinghouses)
- Accounts receivable management
- Payment plans for patients

**Insurance Verification**:
- Real-time eligibility checking via API (Availity, Change Healthcare)
- Automated insurance information updates
- Coverage verification before appointments
- Benefits breakdown display to patients
- Out-of-pocket cost estimates
- Prior authorization workflow

**Interoperability & Standards**:
- Full HL7 FHIR server implementation
- SMART on FHIR app platform (allow third-party apps)
- CCD/CCDA import/export
- DirectTrust secure messaging with other providers
- Integration with Health Information Exchanges (HIEs)
- API marketplace for third-party integrations

**Advanced Analytics**:
- Population health management dashboard
- Chronic disease registry
- Quality measure tracking (HEDIS, MIPS)
- Predictive modeling for readmissions
- Social determinants of health tracking
- Data warehouse for business intelligence
- Custom report builder

### 14.4 Long-Term Vision (24+ months)

**Remote Patient Monitoring (RPM)**:
- Integration with wearable devices (Fitbit, Apple Watch, glucose monitors)
- IoT device data ingestion (blood pressure cuffs, pulse oximeters)
- Real-time vital sign monitoring
- Alert thresholds for providers
- Chronic disease management programs (diabetes, hypertension, CHF)
- Medicare RPM billing codes support

**Specialty-Specific Modules**:
- Cardiology: ECG/EKG interpretation, pacemaker monitoring
- Dermatology: Image comparison for lesion tracking
- Behavioral Health: PHQ-9/GAD-7 screening, therapy notes
- Pediatrics: Growth charts, vaccine schedules
- Obstetrics: Prenatal visits, ultrasound images
- Chronic Care Management: Care plans, goal tracking

**Multi-Language Support**:
- Internationalization (i18n) framework
- Spanish translation (primary priority)
- Additional languages: Mandarin, Vietnamese, Tagalog, etc.
- Right-to-left language support (Arabic, Hebrew)
- Cultural customization

**Telemedicine Expansion**:
- Multi-state provider licensing management
- Cross-border telemedicine compliance
- International consultations (for medical tourism)
- Specialty teleconsultations marketplace

---

## 15. Appendices

### 15.1 Glossary

- **API**: Application Programming Interface - Allows software components to communicate
- **BAA**: Business Associate Agreement - Contract required under HIPAA when third party handles PHI
- **CCDA/CCD**: Consolidated Clinical Document Architecture/Continuity of Care Document - Standard for health record exchange
- **CORS**: Cross-Origin Resource Sharing - Security feature controlling which websites can access the API
- **EHR**: Electronic Health Records - Digital version of patient medical charts
- **HL7 FHIR**: Fast Healthcare Interoperability Resources - Standard for exchanging healthcare information
- **HIPAA**: Health Insurance Portability and Accountability Act - US law protecting patient health information
- **JWT**: JSON Web Token - Secure method for transmitting authentication information
- **Mongoose**: Object Data Modeling (ODM) library for MongoDB and Node.js
- **NFR**: Non-Functional Requirement - System quality attribute (security, performance, etc.)
- **ODM**: Object Document Mapper - Translates code objects to database documents
- **PHI**: Protected Health Information - Any health information that can identify an individual
- **RBAC**: Role-Based Access Control - Permissions assigned based on user roles
- **RPM**: Remote Patient Monitoring - Technology to monitor patients outside clinical settings
- **SLA**: Service Level Agreement - Commitment between service provider and client
- **TLS/SSL**: Transport Layer Security/Secure Sockets Layer - Protocols for encrypted communication
- **WebSocket**: Protocol for two-way interactive communication between browser and server

### 15.2 References

**Standards & Compliance**:
- HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/index.html
- HL7 FHIR: https://www.hl7.org/fhir/
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/

**Technology Documentation**:
- React 19: https://react.dev/
- Express.js: https://expressjs.com/
- Mongoose: https://mongoosejs.com/
- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Socket.IO: https://socket.io/docs/
- JSON Web Tokens: https://jwt.io/

**Best Practices**:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/

### 15.3 Document Control

**Document Information**:
- Document Title: Telehealth Platform - Business Requirements Document (BRD)
- Project Name: Telehealth Platform for henrydjorgee.com
- Version: 1.0
- Date: December 7, 2025
- Status: Draft for Client Review

**Revision History**:
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-07 | AI Development Team | Initial BRD creation based on codebase analysis |

**Approval**:
| Role | Name | Signature | Date |
|------|------|-----------|------|
| Project Sponsor | | | |
| Product Owner | | | |
| Technical Lead | | | |
| Compliance Officer | | | |

**Distribution List**:
- Client Stakeholders
- Development Team
- Quality Assurance Team
- Security/Compliance Team
- Project Manager

---

## 16. Contact Information

**Project Team**:
- Project Manager: [To be assigned]
- Technical Lead: [To be assigned]
- Product Owner: [To be assigned]

**Support**:
- Technical Support: [email/phone to be determined]
- General Inquiries: [contact@henrydjorgee.com]

**Domain**:
- Production URL: https://henrydjorgee.com
- Development URL: http://localhost:3000

---

**END OF DOCUMENT**

---

**Next Steps**:
1. Review this BRD with all stakeholders
2. Prioritize features for MVP vs future phases
3. Obtain formal approval and sign-off
4. Create detailed technical specifications from approved requirements
5. Develop project timeline and resource allocation
6. Begin iterative development with regular stakeholder reviews

