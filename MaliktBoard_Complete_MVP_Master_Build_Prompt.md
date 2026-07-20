# MaliktBoard — Complete MVP Master Build Prompt

You are the lead product architect and senior full-stack engineer responsible for designing and implementing **MaliktBoard**, a multi-tenant SaaS platform for domestic delivery companies.

Build the complete MVP as a production-quality foundation. Do not produce only mockups or disconnected screens. Implement the database, authentication, permissions, core workflows, web applications, Android-first mobile scanning application, QR labels, tracking, notifications, audit history, tests, seed data, and deployment documentation.

The product name must always be written as:

**MaliktBoard**

---

# 1. Product Vision

MaliktBoard brings fragmented delivery companies into one operational platform.

Each delivery company receives its own isolated workspace, branded public page, company handle, team accounts, locations, route network, shipment requests, shipment records, dispatch batches, QR labels, tracking pages, and operational dashboards.

Customers normally reach a delivery company through:

* A company-specific public page
* A company handle
* A direct shipment-request link
* An invitation sent by the company

MaliktBoard is not initially a public marketplace where customers compare delivery companies. Customers choose and interact with one specific company.

Each company operates independently. Shipments, batches, locations, users, customers, evidence, and operational data must never mix between companies.

There is no company-to-company shipment transfer in the MVP.

---

# 2. Core Product Model

The core hierarchy is:

```text
Delivery Company
  ├── Company Locations
  ├── Route Legs
  ├── Team Members
  ├── Customers
  ├── Shipment Requests
  ├── Shipments
  │     └── Journey Plan
  │           └── Ordered Journey Steps
  └── Dispatch Batches
        └── Multiple Shipments
```

The central operating model is:

1. A customer or company team member submits one shipment request.
2. One request represents one physical package.
3. The delivery company reviews the request.
4. The company issues a preliminary quote.
5. The customer can accept the quote, abandon the request, or allow it to expire.
6. The company confirms the accepted request.
7. The request becomes an active shipment.
8. The shipment receives its own tracking number, QR code, thermal label, and journey plan.
9. The shipment moves through an ordered sequence of route legs.
10. For each applicable route leg, the shipment may be placed inside a Dispatch Batch with other shipments.
11. Scanning and updating the batch updates all eligible shipments currently inside it.
12. At the destination of each route leg, shipments are sorted according to the next step in their individual journey plans.
13. Some shipments stay at that location because it is their final destination.
14. Other shipments are transferred into another Dispatch Batch for their next route leg.
15. The customer receives simplified timeline events until the shipment is delivered or otherwise closed.

---

# 3. Important Terminology

Use these terms consistently throughout the code, database, documentation, and interface.

## Route Leg

A predefined movement segment created by a delivery company.

Example:

```text
Addis Main Hub → Hawassa Transfer Hub
```

A Route Leg describes where goods move from and where they move to.

A Route Leg is not a physical package grouping.

## Dispatch Batch

A scannable operational grouping containing multiple shipments moving together through one Route Leg.

A Dispatch Batch may physically represent:

* A pallet
* A delivery sack
* A cage
* A grouped vehicle load
* A container
* A loose dispatch group

The interface should use the general term:

**Dispatch Batch**

Each Dispatch Batch receives:

* A human-readable batch number
* A secure QR code
* A printable thermal label
* One company
* One Route Leg
* A batch lifecycle
* A list of contained shipments
* An immutable event history

## Shipment

One physical package.

Every physical package requires a separate shipment request in the MVP.

Do not implement multi-package consignments in the initial release.

## Journey Plan

The complete planned movement of one shipment from collection or drop-off to final delivery or collection.

## Journey Step

One ordered stage within a Journey Plan.

A Journey Step can represent:

* Pickup from a customer
* Movement between two company locations
* Final delivery to a receiver
* Final collection from a company store

---

# 4. Hard MVP Boundaries

The following requirements are mandatory.

## Include

* Multi-tenant company workspaces
* Company-specific public pages
* Unique company handles
* Customer and guest shipment requests
* Preliminary quotations
* Manual payment recording
* Locations and route legs
* Automatic journey planning
* Manual journey override
* Shipment QR codes
* Dispatch Batch QR codes
* Thermal label generation
* Android-first mobile scanner
* Limited offline scanning
* Customer tracking
* Secure guest tracking links
* Email notifications
* In-app notifications
* Evidence uploads
* Role- and location-based permissions
* Platform administration
* Usage recording
* Audit logs
* English, Amharic, and Afaan Oromo foundations
* Responsive web interfaces
* Production-ready database security
* Automated tests
* Seed data
* Deployment documentation

## Do Not Include

* No public delivery-company marketplace
* No company-to-company transfers
* No separate Driver entity
* No Driver role
* No fleet or vehicle-management module
* No live vehicle GPS tracking
* No online payment integration
* No SMS integration in the first release
* No international shipping
* No multi-package form
* No customer bidding between companies
* No contract limits on shipment count, team members, or locations
* No complex address-standardization requirement
* No requirement for formal street addresses
* No business-intelligence-heavy dashboard
* No unnecessary artificial intelligence features

Team members may physically be riders, drivers, warehouse workers, store employees, or dispatch workers, but MaliktBoard must treat all of them simply as team members with permissions.

---

# 5. Required Technology Stack

Build a TypeScript monorepo.

Recommended structure:

```text
/apps
  /web
  /mobile

/packages
  /database
  /domain
  /ui
  /types
  /validation
  /i18n
  /config
  /qr
  /notifications
```

Use:

* Next.js with the App Router
* TypeScript in strict mode
* React
* Expo and React Native
* Android-first mobile support
* Supabase Authentication
* PostgreSQL through Supabase
* Supabase Storage
* Supabase Realtime where appropriate
* PostgreSQL Row-Level Security
* Zod for validation
* React Hook Form or equivalent
* A documented transactional service layer
* Background-job abstraction for notifications
* A provider abstraction for email delivery
* A provider abstraction for future SMS delivery
* Secure environment-variable handling
* Automated migrations
* Seed scripts
* Automated tests

A monorepo tool such as Turborepo and a package manager such as pnpm may be used.

Do not tightly couple business logic to React components.

Place the important domain logic in reusable services and packages so both the web application and mobile application use the same rules.

---

# 6. Required Documentation Before Implementation

Before building product features, create and maintain:

```text
/docs/PRODUCT_SPEC.md
/docs/ARCHITECTURE.md
/docs/DATA_MODEL.md
/docs/SECURITY_MODEL.md
/docs/PERMISSIONS.md
/docs/STATE_MACHINES.md
/docs/OFFLINE_SYNC.md
/docs/IMPLEMENTATION_PLAN.md
/docs/QA_CHECKLIST.md
/docs/DEPLOYMENT.md
/docs/DECISIONS.md
/docs/PROGRESS.md
```

The coding agent must:

1. Convert this master prompt into an implementation plan.
2. Identify assumptions.
3. Record assumptions in `DECISIONS.md`.
4. Divide implementation into phases.
5. Maintain a progress checklist.
6. Update documentation when implementation decisions change.
7. Never silently replace a product requirement with a different behavior.
8. Mark incomplete features clearly.
9. Do not use fake buttons, dead navigation, or misleading placeholder behavior in the finished MVP.

---

# 7. Multi-Tenant Security Model

MaliktBoard is a strict multi-tenant platform.

Every company-owned operational record must contain a `company_id`.

This includes:

* Locations
* Route legs
* Company customers
* Shipment requests
* Quotes
* Shipments
* Journey plans
* Journey steps
* Dispatch batches
* Dispatch Batch memberships
* Shipment events
* Batch events
* Evidence
* Payments
* Notifications
* Team assignments
* Company branding
* Contracts
* Usage records
* Audit events

Requirements:

* A company user may access only records belonging to their company.
* A customer may access only records to which they are explicitly connected.
* A guest may access only a shipment exposed through a valid secure tracking token or correctly validated tracking credentials.
* A team member’s access is further restricted by role, assigned location, route-leg responsibility, batch assignment, or shipment assignment.
* PostgreSQL Row-Level Security must enforce tenant boundaries.
* Do not rely only on client-side filtering.
* Server-side service methods must verify the company and actor context.
* Cross-tenant identifiers must never reveal another company’s data.
* QR codes must use opaque, non-sequential identifiers.
* Public tracking tokens must be revocable and difficult to guess.
* Sensitive evidence must use private storage buckets and signed URLs.
* Platform-administrator access must be audited.
* Support impersonation, when implemented, must require explicit initiation and produce an audit event.
* Platform administrators must not casually browse private customer evidence.

Write automated tenant-isolation tests.

---

# 8. User Types and Roles

## Platform-Level Role

### Platform Administrator

Can:

* Create and manage delivery-company accounts
* Review usage
* Record contracts
* Activate or suspend companies
* View operational totals
* Manage platform configuration
* Review system health
* Access support tools
* Perform audited support access
* Manage email-provider configuration
* Review company activity for negotiated billing

Platform administrators must not appear as normal members of company workspaces.

## Company Roles

### Company Owner

Full control over the company workspace.

Can manage:

* Company profile
* Branding
* Locations
* Route legs
* Team members
* Permissions
* Requests
* Quotes
* Shipments
* Journey plans
* Batches
* Evidence rules
* Payments
* Notifications
* Reports
* Settings

### Company Administrator

Similar to the owner, except ownership transfer and certain contract-level settings may remain owner-only.

### Operations Manager / Supervisor

Can:

* Review requests
* Issue quotes
* Confirm shipments
* Plan and override journeys
* Create and manage batches
* Reopen sealed batches
* Authorize exceptional shipment removal
* Reverse eligible operational errors
* Review exceptions
* Manage operational team assignments
* View company operational analytics

### Team Member

A general operational user.

A Team Member may physically be:

* A motorcycle courier
* A driver
* A store employee
* A warehouse worker
* A dispatch worker
* A receiving worker

The system must not distinguish between these occupations.

Team Members may perform permitted actions based on:

* Their assigned company locations
* Their role permissions
* Their route-leg assignments
* Their batch assignments
* Their shipment assignments

### Read-Only Viewer

Can view authorized operational records but cannot change shipment or batch states.

## Customer

A customer can:

* Create shipment requests
* Be a sender
* Be a receiver
* Own and pay for a shipment they initiated
* Review preliminary quotes
* Accept a quote
* Abandon a request
* Track shipments
* Receive in-app and email notifications
* View approved evidence
* Contact the delivery company
* View shipments where they are the owner, sender, or receiver, subject to privacy rules

The customer who initiates the request is the shipment owner and payer, even when that customer is listed as the receiver rather than the sender.

## Guest Customer

A shipment request can be created for a person without a MaliktBoard account.

Guests may:

* Submit a request through a company’s public page
* Receive a secure tracking link
* Track a shipment through that link
* Use tracking number plus phone number as a fallback
* Review and accept a preliminary quote through a secure flow
* Receive email notifications when an email address is provided

---

# 9. Company Public Pages and Handles

Each delivery company must have a unique public handle.

Example:

```text
maliktboard.com/@companyhandle
```

Also support stable alternatives if required by framework routing:

```text
maliktboard.com/c/companyhandle
```

Each company public page must be customizable and must tell the company’s story.

Required branding fields:

* Company name
* Public handle
* Logo
* Favicon
* Cover or hero image
* Primary brand color
* Secondary brand color
* Accent color
* Light or dark text preference
* Heading typography choice
* Body typography choice
* Short description
* Full company story
* Service description
* Contact information
* Social links
* Operating locations
* Business hours
* Customer instructions
* Call-to-action labels

Provide at least three configurable public-page layout templates so company pages can look meaningfully different rather than appearing as identical pages with different colors.

Allow configurable:

* Hero arrangement
* Section order
* Card treatment
* Border radius
* Navigation style
* Background treatment
* Button style
* Image placement

Every public company page should provide:

* Company introduction
* Service information
* Available locations
* “Request a Shipment” action
* “Track a Shipment” action
* Contact action
* Branded request form
* Branded tracking experience

Do not show other delivery companies on a company’s public page.

---

# 10. Company Locations

Each company can create multiple locations.

Examples:

* Shipping store
* Receiving store
* Transfer hub
* Warehouse
* Office
* Dispatch point
* Collection point

A location may have multiple capabilities.

Do not force a location to have only one fixed type.

Supported location capabilities should include:

* Accept customer drop-offs
* Release shipments to receivers
* Receive incoming Dispatch Batches
* Dispatch outgoing Dispatch Batches
* Transfer shipments
* Support customer pickup requests
* Support final delivery
* Store shipments temporarily
* Handle shipment exceptions

A multi-purpose location is simply a location with several capabilities. The interface does not need to prominently use the phrase “multi-purpose branch.”

Location fields:

* Company
* Name
* Internal code
* Public name
* Description
* Region
* City or town
* Area or landmark description
* Optional latitude
* Optional longitude
* Contact phone
* Operating hours
* Active status
* Supported capabilities
* Customer-visible status

Formal street addresses must not be required.

Use flexible location descriptions suitable for countries where standardized street addressing may be incomplete.

---

# 11. Team Assignment Model

A team member may be assigned to one or more company locations.

A team member’s work visibility should be derived primarily from location assignment.

Examples:

* A team member assigned to an origin store can see shipments awaiting receipt or dispatch there.
* A team member assigned to a destination store can see incoming batches and shipments expected there.
* A team member assigned to a transfer hub can receive arriving batches and prepare shipments for the next route leg.
* A team member assigned to a final-delivery location can see shipments awaiting final delivery or collection.

Also support optional explicit assignment to:

* Route legs
* Dispatch Batches
* Individual shipments

Recommended visibility rule:

```text
Visible work =
  location-based work
  + explicitly assigned route legs
  + explicitly assigned batches
  + explicitly assigned shipments
```

Managers and administrators can see company-wide operations.

Permission checks must consider both:

1. Role permission
2. Operational scope

---

# 12. Route Network

Each company creates its own private route network.

A Route Leg connects two company locations.

Example:

```text
Addis Main Hub → Hawassa Transfer Hub
```

Route Leg fields should include:

* Company
* Name
* Public label
* Internal code
* Origin location
* Destination location
* Estimated duration
* Operational instructions
* Customer-visible departure text
* Customer-visible arrival text
* Priority or routing weight
* Active status
* Allowed service types
* Optional days of operation
* Optional expected departure times
* Required evidence rules
* Assigned team members

Route legs never connect different companies.

---

# 13. First-Mile and Final-Mile Handling

The product must support several shipment service configurations.

## Origin Options

* Customer drops package at a company location
* Company arranges motorcycle pickup from the sender
* Team member directly receives the package in the field
* Shipment begins at a selected shipping store

## Destination Options

* Company delivers to the receiver
* Receiver collects from a company location
* Shipment ends at a receiving store
* Shipment ends at a transfer or destination hub

Because formal addresses may not be available, customer pickup and final-delivery endpoints should support:

* Free-text area
* Landmark
* Phone number
* Optional map pin
* Optional latitude and longitude
* Collection instructions
* Delivery instructions

Do not require a standardized address.

Model first-mile and final-mile movement as special Journey Steps.

Examples:

```text
Sender pickup point → Bole Shipping Store
```

```text
Hawassa Receiving Store → Receiver delivery point
```

The predefined company network remains based on Route Legs between company locations.

The journey may therefore contain:

1. Optional dynamic pickup step
2. One or more predefined network Route Legs
3. Optional dynamic final-delivery step

---

# 14. Automatic Journey Planning

When an active shipment is created, MaliktBoard must generate a proposed Journey Plan.

Inputs may include:

* Origin mode
* Origin company location
* Pickup requirement
* Destination mode
* Destination company location
* Final-delivery requirement
* Service type
* Package restrictions
* Active route network

The system should calculate an appropriate path through the company’s active Route Legs.

For the MVP, route calculation can prioritize:

1. Valid connectivity
2. Route priority
3. Lowest number of legs
4. Estimated duration

Operations Managers must be able to:

* Review the proposed journey
* Add steps
* Remove steps
* Reorder steps
* Replace a Route Leg
* Change the pickup location
* Change the final-delivery location
* Confirm the final Journey Plan

The Journey Plan should normally be confirmed before the shipment begins network movement.

Each shipment has its own Journey Plan, even when it travels inside batches with other shipments.

At every arrival location, the system must determine:

* Whether the shipment has reached its final destination
* Whether it is ready for receiver collection
* Whether it requires final delivery
* Whether another Journey Step remains
* Which next Route Leg applies
* Which outgoing Dispatch Batches are compatible

---

# 15. Shipment Request Workflow

One form creates one shipment request for one physical package.

A request may be initiated by:

* An authenticated customer
* A guest customer
* A company team member on behalf of a customer

When a team member creates a request, ask:

```text
Does this customer have a MaliktBoard account?
```

If yes:

* Search by phone number, email, or customer identifier
* Link the existing customer account
* Confirm sender and receiver roles

If no:

* Collect guest customer information
* Create a company-scoped guest customer record
* Generate secure request and tracking access

Required request information:

* Initiating customer
* Initiator account or guest status
* Payer
* Sender name
* Sender phone
* Sender email when available
* Sender account link when available
* Receiver name
* Receiver phone
* Receiver email when available
* Receiver account link when available
* Origin method
* Origin company location when applicable
* Pickup area or landmark when applicable
* Destination method
* Destination company location when applicable
* Delivery area or landmark when applicable
* Package contents
* Package description
* Package quantity, normally one package
* Estimated weight
* Package dimensions when known
* Package value when relevant
* Fragile status
* Special handling instructions
* Shipment photograph
* Preferred date
* Estimated-delivery requirement
* Customer notes
* Terms acknowledgement

The initiator is the shipment owner and payer.

The initiator may be either:

* The sender
* The receiver

---

# 16. Request and Quote State Machine

Use an explicit state machine.

Recommended request states:

```text
SUBMITTED
UNDER_REVIEW
PRELIMINARY_QUOTE_ISSUED
CUSTOMER_ACCEPTED
COMPANY_CONFIRMED
EXPIRED
ABANDONED
REJECTED
CANCELLED
```

Rules:

* `SUBMITTED`: request has been sent to the selected company.
* `UNDER_REVIEW`: company is evaluating the request.
* `PRELIMINARY_QUOTE_ISSUED`: a quote has been provided.
* `CUSTOMER_ACCEPTED`: customer accepted the preliminary quote.
* `COMPANY_CONFIRMED`: company confirmed the accepted request and may activate the shipment.
* `EXPIRED`: quote or request expired.
* `ABANDONED`: customer stopped the process or explicitly abandoned it.
* `REJECTED`: company declined the request.
* `CANCELLED`: request was cancelled before activation.

A preliminary quote must include:

* Quoted amount
* Currency
* Quote notes
* Quote expiration date
* Pricing assumptions
* Statement that the amount may change after physical inspection
* Optional expected delivery date
* Optional service type

The customer may:

* Accept the quote
* Abandon the request
* Allow the quote to expire

A counteroffer workflow is not required in the MVP.

When the company confirms an accepted request:

* Create the active Shipment
* Generate the shipment number
* Generate the secure QR identifier
* Generate the tracking token
* Create the proposed Journey Plan
* Generate the thermal label
* Record the activation event

---

# 17. Preliminary and Final Pricing

The preliminary quote may change after inspection.

Store:

* Preliminary amount
* Final amount
* Adjustment amount
* Adjustment reason
* Currency
* Customer acknowledgement status
* Payment notes

Manual payment statuses:

```text
UNPAID
PARTIALLY_PAID
PAID
PAYMENT_ON_DELIVERY
WAIVED
REFUNDED
```

No payment gateway is required.

Allow authorized staff to record:

* Amount received
* Payment date
* Payment method
* Reference number
* Recorded by
* Notes

All payment changes must be audited.

---

# 18. Shipment Record

Each Shipment must include:

* Company
* Shipment number
* Secure QR identifier
* Current human-readable route code
* Request reference
* Initiating customer
* Payer
* Sender
* Receiver
* Origin method
* Destination method
* Origin location or pickup endpoint
* Destination location or delivery endpoint
* Package description
* Contents
* Weight
* Dimensions
* Value when applicable
* Handling instructions
* Service type
* Preliminary price
* Final price
* Payment status
* Shipment status
* Current location
* Current Journey Step
* Current Dispatch Batch
* Estimated delivery date
* Actual delivery date
* Customer-visible timeline
* Internal event history
* Evidence
* Exception state
* Created by
* Created date
* Updated date

A shipment can be connected to:

* An initiating customer
* A sender account
* A receiver account

Authenticated customers should see shipments in which they are:

* The initiator
* The sender
* The receiver

The interface must distinguish ownership from participation.

The initiator remains responsible for payment.

---

# 19. Shipment Operational Status

Keep shipment statuses understandable and minimal.

Recommended top-level operational states:

```text
AWAITING_COMPANY_RECEIPT
RECEIVED_BY_COMPANY
IN_TRANSIT
AT_COMPANY_LOCATION
READY_FOR_COLLECTION
OUT_FOR_DELIVERY
DELIVERY_ATTEMPTED
DELIVERED
ON_HOLD
DAMAGED
MISSING
RETURNING
RETURNED
CANCELLED
```

Journey-specific detail belongs in Journey Steps and timeline events rather than creating dozens of top-level shipment states.

---

# 20. Journey Step Status

Each Journey Step may use:

```text
PENDING
READY
DEPARTED
ARRIVED
COMPLETED
SKIPPED
EXCEPTION
```

The two principal movement events for a normal network Route Leg are:

* Departed origin
* Arrived at destination

These become customer-visible timeline events.

The additional internal states exist to support workflow control but should not make the interface unnecessarily complicated.

---

# 21. Dispatch Batch Lifecycle

Use this lifecycle:

```text
DRAFT
OPEN
SEALED
DISPATCHED
ARRIVED
CLOSED
```

## Draft

The batch exists but is not yet available for normal loading.

## Open

Eligible shipments may be added or removed.

## Sealed

Normal modifications are locked.

A supervisor may reopen the batch before dispatch.

## Dispatched

The batch has departed its origin location.

Rules:

* All eligible shipments currently inside inherit the departure update.
* The corresponding Journey Step becomes `DEPARTED`.
* A customer-visible departure event is created.
* Notifications are triggered.
* Removing a shipment requires supervisor authorization and an audit reason.

## Arrived

The batch has arrived at the destination location.

Rules:

* All eligible shipments currently inside inherit the arrival update.
* The corresponding Journey Step becomes `ARRIVED` or `COMPLETED`.
* A customer-visible arrival event is created.
* Notifications are triggered.
* The system determines the next required action for each shipment.

## Closed

Every contained shipment has been processed at the arrival location.

A shipment is considered processed when it has:

* Reached its final company destination
* Become ready for collection
* Moved to final delivery
* Been transferred into another Dispatch Batch
* Been placed on hold
* Been moved into an exception workflow

---

# 22. Dispatch Batch Membership Rules

Each Dispatch Batch:

* Belongs to exactly one company
* Belongs to exactly one Route Leg
* Has one origin location
* Has one destination location
* May contain shipments from many customers
* Must never contain shipments from another company

A shipment may belong to only one active Dispatch Batch at a time.

To transfer a shipment:

1. Scan the shipment QR code.
2. Scan or select the destination Dispatch Batch.
3. Confirm the destination batch and Route Leg.
4. Validate that the next Journey Step matches the destination batch.
5. Remove the active membership from the old batch when appropriate.
6. Add the shipment to the new batch.
7. Record an immutable transfer event.

Normal individual movement updates should not be applied while the shipment is correctly inside a batch.

Movement status should be inherited from the batch.

Individual shipment updates while inside a batch are reserved for:

* Removal
* Exception
* Damage
* Missing shipment
* Hold
* Incorrect sorting
* Supervisor-authorized correction
* Final delivery when the shipment has left the batch
* Delivery attempt
* Return handling

---

# 23. Batch-Level Bulk Updates

Scanning a Dispatch Batch QR code must support bulk operational updates.

Before a bulk update, show a confirmation such as:

```text
This will mark 47 eligible shipments as departed from Addis Main Hub.

3 shipments will be skipped because they are on hold or no longer belong to this batch.

Continue?
```

Bulk actions must:

* Update only eligible shipments
* Skip cancelled shipments
* Skip delivered shipments
* Skip removed shipments
* Skip shipments on incompatible Journey Steps
* Skip shipments already updated
* Skip shipments in blocking exception states
* Be idempotent
* Return a clear summary
* Record one batch event
* Record linked shipment events
* Trigger customer notifications only once

---

# 24. Shipment Sorting at Arrival

When a Dispatch Batch arrives, display a sorting workspace.

Group contained shipments into categories such as:

* Final destination reached
* Ready for customer collection
* Ready for final delivery
* Next Route Leg A
* Next Route Leg B
* On hold
* Journey mismatch
* Exception

For shipments continuing through the network, show:

* Next destination
* Next Route Leg
* Compatible open Dispatch Batches
* Whether a new Dispatch Batch must be created

Support rapid transfer:

1. Open a destination batch.
2. Enter rapid-scan mode.
3. Scan compatible shipment labels consecutively.
4. Show success or error feedback immediately.
5. Keep a visible running count.
6. Allow undo only while operationally safe.
7. Record every transfer.

---

# 25. Minimal Internal Events

Keep internal events useful but not excessive.

Required event categories:

* Request submitted
* Quote issued
* Quote accepted
* Shipment activated
* Shipment received
* Label generated
* Label printed or downloaded
* Added to Dispatch Batch
* Removed from Dispatch Batch
* Dispatch Batch sealed
* Dispatch Batch reopened
* Dispatch Batch dispatched
* Dispatch Batch arrived
* Shipment transferred
* Ready for collection
* Out for delivery
* Delivery attempted
* Delivered
* Exception reported
* Hold added
* Hold released
* Damage reported
* Returned
* Cancelled
* Payment recorded
* Evidence uploaded
* Journey changed

Each event should record:

* Actor
* Company
* Timestamp
* Event type
* Related shipment or batch
* Location
* Previous state
* New state
* Optional note
* Optional evidence
* Source device
* Online or offline origin
* Idempotency key where applicable

---

# 26. Customer-Visible Timeline

Customers must see a simplified timeline rather than internal warehouse activity.

Possible customer-visible events:

* Shipment request submitted
* Preliminary quote issued
* Quote accepted
* Shipment confirmed
* Shipment received by delivery company
* Departed `{origin location}`
* Arrived at `{destination location}`
* Ready for collection
* Out for delivery
* Delivery attempted
* Delivered
* Delayed
* On hold
* Damaged
* Returning
* Returned
* Cancelled

Do not expose:

* Internal batch IDs unless useful
* Team-member names by default
* Internal notes
* Supervisor actions
* Permission changes
* Private government-identification evidence
* Internal billing commentary
* Other customers’ information

A customer timeline event should contain:

* Public event title
* Short explanation
* General location
* Date and time
* Estimated delivery date when available
* Approved customer-visible evidence
* Company contact action

---

# 27. Evidence

Support photo-based evidence.

Evidence categories:

```text
PACKAGE_AT_PICKUP
SHIPPER_ID
RECEIVER_ID
PROOF_OF_RECEIPT
PROOF_OF_DELIVERY
DAMAGE
EXCEPTION
OTHER
```

Evidence fields:

* Company
* Shipment
* Batch when relevant
* Journey Step
* Event
* Evidence category
* File
* Uploaded by
* Captured timestamp
* Uploaded timestamp
* Optional note
* Customer-visible status
* Sensitivity classification
* Optional GPS coordinates
* Device identifier

Companies must be able to configure evidence requirements by:

* Event type
* Journey Step type
* Service type
* Location
* Final-delivery workflow

Examples:

* Require package photo when receiving a shipment.
* Require damage photo when reporting damage.
* Require receiver ID and proof-of-delivery photo before delivery completion.
* Require shipper ID for selected shipment categories.

## Privacy Rules

General operational photos may be visible to authorized customers.

Government identification photos must be restricted to authorized company staff.

Customer tracking may display:

```text
Receiver identity verified
```

Do not show the government-ID image itself to customers by default.

Platform support personnel may access sensitive evidence only through an explicit audited support-access process.

Use private storage and time-limited signed URLs.

---

# 28. Delivery Authorization

Use a Delivery PIN for secure delivery.

Workflow:

1. Generate a private PIN for the shipment.
2. Make the PIN visible to the initiating customer.
3. The initiating customer shares the PIN with the intended receiver.
4. The operational team member requests the PIN at delivery.
5. The team member enters the PIN in the mobile application.
6. The system validates the PIN.
7. Required proof-of-delivery evidence is captured.
8. The receiver’s name is recorded.
9. Receiver identification may be photographed when required.
10. The shipment is marked delivered.
11. The event is added to the customer timeline.
12. Email and in-app notifications are sent.

Make Delivery PIN requirements configurable by company and service type, but enable them by default for direct delivery.

Protect against repeated guessing:

* Rate-limit attempts
* Record failed attempts
* Allow supervisor override only with a mandatory reason
* Audit all overrides
* Do not expose the PIN in logs

---

# 29. Customer Tracking

Support both authenticated and guest tracking.

## Authenticated Tracking

Customers can view:

* Shipments they initiated
* Shipments where they are the sender
* Shipments where they are the receiver
* Request status
* Preliminary quote
* Payment summary
* Estimated delivery
* Current public shipment status
* Customer-visible timeline
* Approved evidence
* Company contact information

## Guest Tracking

Primary method:

* Secure private tracking link containing a revocable token

Fallback method:

* Tracking number
* Matching phone number

The secure token must:

* Be opaque
* Be unguessable
* Be revocable
* Avoid exposing internal database IDs
* Support expiration or rotation
* Be scoped to one shipment

Guest tracking must use the delivery company’s branding.

---

# 30. Notifications

Initial notification channels:

* Email
* In-app notification

Prepare an abstraction for future:

* SMS
* WhatsApp

All customer-visible events should automatically generate notifications.

Prevent duplicate notifications when:

* Offline scans synchronize
* A bulk batch update is retried
* A request is repeated because of a network timeout
* Realtime events are delivered more than once

Notification records should include:

* Recipient
* Shipment
* Event
* Channel
* Template
* Locale
* Delivery state
* Attempt count
* Provider reference
* Failure reason
* Sent time
* Read time

Allow company-branded email templates.

---

# 31. QR Codes

Every Shipment and Dispatch Batch receives a QR code.

The QR payload must contain only a secure opaque identifier or secure application URL.

Do not embed:

* Customer phone number
* Customer name
* Package contents
* Delivery PIN
* Sensitive shipment details
* Raw sequential database ID

Support:

* Shipment QR scanning
* Dispatch Batch QR scanning
* Secure deep linking into the mobile application
* Web fallback when the mobile application is not installed
* Human-readable manual identifiers
* Regeneration and revocation
* Scan audit history

---

# 32. Shipment Thermal Label

Generate a 4×6-inch thermal label PDF.

Include:

* Delivery-company logo
* Delivery-company name
* Human-readable shipment number
* Large QR code
* Sender name
* Sender phone, partially masked when appropriate
* Receiver name
* Receiver phone, partially masked when appropriate
* Origin location
* Final destination location
* Current or first network Route Leg
* Destination code
* Handling instructions
* Weight when available
* Creation date
* Estimated delivery date when available
* Clear human-readable routing identifier

The label must remain useful if QR scanning temporarily fails.

Use a routing block such as:

```text
FINAL: HAWASSA-RS
NEXT: ADDIS-HUB → HAWASSA-HUB
```

Generate searchable filenames such as:

```text
2026-07-19_Amina-Mohammed_MB-104829.pdf
```

Sanitize filenames safely.

Allow:

* Individual label download
* Re-download
* Regeneration
* Browser print
* Batch ZIP download for selected labels
* Optional direct print integration later

Do not require MaliktBoard to directly control a Bluetooth printer in the MVP. The generated PDF should be easy to save and print using the device’s normal printing workflow.

---

# 33. Dispatch Batch Label

Generate a separate 4×6 thermal label for every Dispatch Batch.

Include:

* Company logo
* Company name
* Dispatch Batch number
* Large QR code
* Origin
* Destination
* Route Leg
* Shipment count
* Batch status
* Creation date
* Expected departure
* Expected arrival
* Human-readable batch identifier
* Handling note

Example filename:

```text
2026-07-19_BATCH-ADH-HWH-0048.pdf
```

---

# 34. Android-First Mobile Application

The mobile application should be intentionally lightweight.

Primary users are operational Team Members and supervisors.

Required screens:

* Sign in
* Select company when applicable
* Select or confirm active work location
* Home
* Assigned work
* Shipments
* Dispatch Batches
* Scanner
* Rapid scan
* Shipment details
* Dispatch Batch details
* Create shipment request
* Receive shipment
* Add shipment to batch
* Remove shipment from batch
* Transfer shipment
* Update status
* Upload evidence
* Exceptions
* Recent activity
* Personal analytics
* Profile
* Sync status

## Mobile Home

Show:

* Current location assignment
* Work awaiting action
* Incoming batches
* Open batches
* Shipments awaiting receipt
* Shipments awaiting sorting
* Shipments awaiting final delivery
* Exceptions
* Offline sync state

## Personal Analytics

Keep mobile analytics small and operational.

Show:

* Scans today
* Shipments received today
* Shipments transferred today
* Batches processed today
* Deliveries completed today
* Exceptions reported
* Pending assigned work

Do not attempt to reproduce the full company dashboard on mobile.

---

# 35. Mobile Scanning Modes

Support:

## Single Scan

Scan one Shipment or Dispatch Batch and show available actions.

## Rapid Shipment Scan

The user selects an action or destination batch first, then scans many shipments consecutively.

## Batch Scan

Scan a Dispatch Batch to:

* View it
* Seal it
* Dispatch it
* Mark it arrived
* Begin sorting
* Close it

## Shipment-to-Batch Transfer

1. Scan shipment.
2. Scan destination batch.
3. Validate compatibility.
4. Confirm transfer.
5. Show success.

## Batch Bulk Update

1. Scan batch.
2. Select allowed update.
3. Show affected shipment count.
4. Show skipped shipment count.
5. Confirm.
6. Apply idempotent update.
7. Display result summary.

Use strong visual and vibration feedback for successful and failed scans.

---

# 36. Offline Support

Implement limited offline capability for the Android mobile application.

Offline-supported actions should include:

* Scan Shipment QR
* Scan Dispatch Batch QR
* Queue status updates
* Queue evidence metadata
* Queue shipment-to-batch transfers
* View recently cached assigned work
* View sync queue

Requirements:

* Every queued action receives a client-generated idempotency key.
* Preserve the original device timestamp.
* Record the eventual server timestamp.
* Retry safely.
* Never create duplicate shipment events.
* Never send duplicate customer notifications.
* Show pending, synchronized, failed, and conflict states.
* Prevent silent data loss.
* Allow users to retry failed actions.
* Allow supervisors to review conflicts.
* Do not falsely display an offline action as server-confirmed.

Evidence files may upload when connectivity returns.

Document the synchronization and conflict strategy in `OFFLINE_SYNC.md`.

---

# 37. Web Application Areas

The web application must support four primary experiences.

## A. Platform Administration

Pages:

* Platform overview
* Companies
* Create company
* Company detail
* Contracts
* Usage
* Activity review
* Suspensions
* Support access
* System notifications
* Audit logs
* Platform settings

## B. Company Operations Dashboard

Pages:

* Overview
* Shipment requests
* Quotes
* Shipments
* Journey planning
* Dispatch Batches
* Batch sorting
* Locations
* Route legs
* Customers
* Team members
* Assignments
* Evidence review
* Exceptions
* Payments
* Tracking review
* Notifications
* Analytics
* Branding
* Public company page editor
* Settings
* Audit history

## C. Customer Portal

Pages:

* Dashboard
* New shipment request
* Requests
* Quotes
* Shipments
* Tracking
* Notifications
* Profile
* Connected companies

## D. Public Company Experience

Pages:

* Branded company page
* Shipment request
* Request confirmation
* Secure quote review
* Secure tracking
* Contact company
* Public operating locations

---

# 38. Company Dashboard

Keep the primary dashboard operational rather than intelligence-heavy.

Show:

* New requests
* Requests awaiting review
* Quotes awaiting response
* Accepted quotes awaiting confirmation
* Shipments awaiting receipt
* Shipments in transit
* Shipments at transfer locations
* Shipments ready for collection
* Shipments out for delivery
* Delayed shipments
* Exceptions
* Open batches
* Incoming batches
* Delivered today
* Estimated revenue
* Recorded payments
* Active team members
* Recent activity

Support filtering by:

* Date
* Location
* Route Leg
* Shipment state
* Batch state
* Team member
* Customer
* Payment state
* Exception state

---

# 39. Platform Billing and Usage

Companies pay MaliktBoard through manually negotiated contracts.

The platform must support:

* Flat-fee contracts
* Activity-based contracts
* Per-shipment contracts
* Per-team-member contracts
* Custom combinations
* Internal contract notes
* Start date
* End date
* Renewal date
* Billing currency
* Negotiated amount
* Billing frequency
* Active status

No automated invoicing or payment collection is required initially.

Record company usage so platform administrators can review:

* Shipment requests
* Activated shipments
* Delivered shipments
* Active users
* Locations
* Route legs
* Dispatch Batches
* Evidence storage
* Email notifications
* Mobile scans
* Monthly activity

Do not enforce hard usage limits in the MVP.

---

# 40. Localization

Prepare the product for:

* English
* Amharic
* Afaan Oromo

Requirements:

* No hard-coded user-facing text in components.
* Use translation keys.
* Support locale selection.
* Persist user locale preference.
* Support company default locale.
* Localize dates and numbers.
* Prepare notification templates for translation.
* Ensure the interface handles longer translated text.
* Use Unicode-safe filenames and text storage.
* Use fonts that correctly display all three languages.

The initial translation files may contain reviewed English and structured placeholders for Amharic and Afaan Oromo if complete translations are not provided, but the architecture must be functional.

Do not claim untranslated text is fully localized.

---

# 41. Recommended Data Model

Create normalized PostgreSQL tables or equivalent structures for at least:

```text
profiles
platform_admins

companies
company_branding
company_contracts
company_usage_daily
company_settings

company_members
roles
permissions
role_permissions
member_location_assignments
member_route_leg_assignments

customers
company_customers
customer_contacts

locations
location_capabilities
route_legs
route_leg_assignments

shipment_requests
shipment_request_parties
shipment_request_files
quotes
quote_events

shipments
shipment_parties
shipment_endpoints
shipment_payments

journey_plans
journey_steps
journey_plan_versions

dispatch_batches
dispatch_batch_memberships
dispatch_batch_events

shipment_events
customer_timeline_events
shipment_exceptions

evidence_files
evidence_requirements

tracking_tokens
delivery_pins

notifications
notification_attempts

labels
label_download_events

offline_actions
device_registrations

audit_logs
support_access_sessions
```

Use immutable history or append-only events where operational traceability matters.

For mutable records, store:

* `created_at`
* `updated_at`
* `created_by`
* `updated_by`
* `company_id` where applicable
* version or optimistic-lock field where appropriate

Use database constraints to prevent:

* Cross-company batch membership
* Shipment membership in multiple active batches
* Journey Steps referencing another company’s Route Leg
* Team assignment across companies
* Duplicate event processing
* Duplicate notification sending
* Invalid state transitions
* Reusing revoked tracking tokens

---

# 42. Audit Requirements

Create audit records for sensitive and operational actions.

Audit:

* Company creation
* Company suspension
* Role changes
* Permission changes
* Team-member invitations
* Location changes
* Route changes
* Journey overrides
* Quote changes
* Price adjustments
* Payment changes
* Shipment cancellation
* Batch reopening
* Shipment removal after dispatch
* State reversal
* Delivery PIN override
* Evidence deletion
* Support access
* Tracking-token regeneration
* Label regeneration

Audit records must contain:

* Actor
* Company
* Action
* Entity
* Entity identifier
* Previous values when appropriate
* New values when appropriate
* Reason
* Timestamp
* IP or device metadata when available

Operational history should not be deletable through normal user interfaces.

---

# 43. Supervisor Overrides

The following actions require supervisor or higher permission:

* Reopen sealed batch
* Remove shipment after batch dispatch
* Reverse departure
* Reverse arrival
* Change a confirmed Journey Plan after movement begins
* Override Delivery PIN
* Mark missing shipment as found
* Delete or replace sensitive evidence
* Cancel an in-transit shipment
* Manually close an unresolved batch
* Bypass route compatibility

Every override requires:

* Explicit confirmation
* Mandatory reason
* Audit record
* Related shipment or batch event

---

# 44. Error Handling

Use clear operational error messages.

Examples:

```text
This shipment belongs to another Dispatch Batch.
```

```text
This shipment’s next planned Route Leg does not match this batch.
```

```text
This Dispatch Batch has already departed.
```

```text
You do not have permission to update shipments at this location.
```

```text
This scan was already processed.
```

```text
The action was saved offline and will synchronize when a connection is available.
```

```text
This shipment has reached its final destination and cannot be added to another network batch.
```

Do not show raw database errors to users.

---

# 45. Seed Data

Create realistic seed data proving multi-tenancy.

Seed at least:

* Two completely separate delivery companies
* Distinct company handles
* Distinct logos or safe placeholders
* Distinct favicons
* Meaningfully different public-page templates
* Different brand colors
* Different company stories
* Multiple locations per company
* Several Route Legs
* Company owners
* Operations managers
* Team members assigned to different locations
* Customers
* Guest customers
* Shipment requests
* Preliminary quotes
* Active shipments
* Journey Plans
* Dispatch Batches
* Customer timeline events
* Evidence metadata
* Payment records
* Exceptions

Seed data must make tenant-isolation testing obvious.

No company should see or search another company’s data.

---

# 46. Required Automated Tests

Implement unit, integration, database-policy, and end-to-end tests.

Critical tests include:

## Tenant Isolation

* Company A cannot access Company B shipments.
* Company A cannot scan Company B QR codes.
* Company A cannot place Company B shipments into its batches.
* Company A customers cannot track Company B shipments.
* Public tracking tokens expose only their intended shipment.

## Request and Quote

* One request creates no shipment until company confirmation.
* Expired quote cannot be accepted.
* Abandoned request cannot be activated without reopening.
* Accepted quote can be confirmed.
* One form creates one physical shipment.

## Journey Planning

* Valid route is generated between connected locations.
* Disconnected locations return a clear planning error.
* Manager can override route.
* Team member cannot override confirmed route without permission.
* Arrival correctly identifies the next Journey Step.

## Dispatch Batches

* Open batch accepts compatible shipments.
* Sealed batch blocks normal modification.
* Supervisor can reopen a sealed batch.
* Dispatch updates all eligible shipments once.
* Arrival updates all eligible shipments once.
* Ineligible shipments are skipped.
* Duplicate requests do not create duplicate events.
* Dispatched shipment removal requires supervisor override.
* Shipment cannot belong to two active batches.

## QR Codes

* QR identifiers are opaque.
* Revoked QR identifiers fail safely.
* Shipment QR resolves only within correct tenant context.
* Batch QR bulk action requires confirmation.

## Offline Synchronization

* Repeated synchronization is idempotent.
* Offline event does not trigger duplicate notification.
* Conflicting transfer is surfaced.
* Failed evidence upload remains retryable.
* Original event time and server synchronization time are both preserved.

## Delivery

* Correct Delivery PIN permits delivery.
* Incorrect PIN is rejected.
* Repeated failed attempts are rate-limited.
* Supervisor override requires a reason.
* Required proof cannot be skipped.
* Customer receives one delivered notification.

## Evidence Privacy

* Customer can view approved delivery photograph.
* Customer cannot access government ID image.
* Unauthorized team member cannot access restricted evidence.
* Support access is audited.

## Labels

* Shipment label PDF renders correctly at 4×6.
* Batch label PDF renders correctly at 4×6.
* Filename is safe and searchable.
* Human-readable routing information is present.

---

# 47. UX Principles

The application serves users with different levels of technical experience.

Use:

* Large action targets
* Simple language
* Clear status labels
* Strong visual hierarchy
* Obvious scanner actions
* Minimal steps
* Visible confirmation
* Clear error recovery
* Search by human-readable shipment number
* Search by customer phone
* Search by customer name
* Search by batch number
* Filters that remain understandable
* Responsive layouts
* Accessible contrast
* Keyboard navigation on web
* Loading states
* Empty states
* Offline states
* Permission-denied states

Do not hide critical actions inside unclear icon-only menus.

Do not overload Team Members with company-wide analytics or administrative options.

---

# 48. Implementation Phases

Implement the complete MVP in controlled phases.

## Phase 1 — Foundation

* Monorepo
* TypeScript configuration
* Supabase project structure
* Database migrations
* Shared packages
* Authentication
* Localization foundation
* Testing foundation
* Environment validation
* Documentation

## Phase 2 — Multi-Tenancy and Permissions

* Companies
* Memberships
* Roles
* Permissions
* Row-Level Security
* Location assignments
* Route assignments
* Tenant-isolation tests
* Platform administration foundation

## Phase 3 — Company Setup and Public Pages

* Company onboarding
* Handles
* Branding
* Favicons
* Public-page templates
* Company story
* Locations
* Company-specific shipment-request page
* Company-specific tracking page

## Phase 4 — Requests, Quotes, and Payments

* Customer accounts
* Guest customers
* Shipment requests
* Package photos
* Quote workflow
* Expiration
* Abandonment
* Acceptance
* Company confirmation
* Manual payment records

## Phase 5 — Route Network and Journey Planning

* Locations
* Capabilities
* Route legs
* Route graph
* Automatic Journey Plan
* Manual override
* Dynamic pickup step
* Dynamic final-delivery step
* Journey validation

## Phase 6 — Shipments, QR Codes, and Labels

* Shipment activation
* Tracking numbers
* Secure QR identifiers
* Shipment labels
* Batch labels
* Label downloads
* Human-readable route codes
* Label audit events

## Phase 7 — Dispatch Batch Operations

* Batch lifecycle
* Batch membership
* Sealing
* Dispatch
* Arrival
* Bulk updates
* Sorting workspace
* Transfer workflow
* Supervisor overrides
* Batch closure

## Phase 8 — Tracking, Evidence, and Notifications

* Customer timeline
* Guest tracking
* Tracking tokens
* Email notifications
* In-app notifications
* Evidence upload
* Evidence rules
* Privacy controls
* Delivery PIN
* Proof of delivery

## Phase 9 — Android Mobile Application

* Authentication
* Assigned work
* Scanning
* Rapid scan
* Batch actions
* Shipment transfer
* Evidence capture
* Exceptions
* Personal analytics
* Offline queue
* Synchronization
* Conflict handling

## Phase 10 — Platform Administration and Analytics

* Contracts
* Usage records
* Company activity
* Company suspension
* Audited support access
* Operational dashboard
* Mobile personal analytics
* Reports

## Phase 11 — Hardening and Release

* End-to-end tests
* Security review
* Accessibility review
* Performance review
* Offline testing
* Label-print testing
* Production migrations
* Backup documentation
* Monitoring
* Deployment guide
* Demo accounts
* Final QA checklist

Do not mark a phase complete until its acceptance tests pass.

---

# 49. Definition of Done

The MVP is complete only when:

* A Platform Administrator can create a delivery company.
* The delivery company can configure its brand and unique handle.
* The company’s public page looks meaningfully branded.
* The company can create locations with multiple capabilities.
* The company can create Route Legs.
* Team members can be assigned to locations.
* A customer can register or submit as a guest.
* A customer can submit one package request.
* The request includes package contents and a shipment photo.
* The company can issue a preliminary quote.
* The quote can expire or be abandoned.
* The customer can accept the quote.
* The company can confirm and activate the shipment.
* The shipment receives a tracking number and QR code.
* A Journey Plan is generated.
* An Operations Manager can override the journey.
* A 4×6 shipment label can be downloaded.
* A Dispatch Batch can be created for one Route Leg.
* Multiple compatible shipments can be placed inside it.
* A 4×6 batch label can be downloaded.
* A batch can be sealed, dispatched, arrived, and closed.
* Batch departure updates all eligible shipments.
* Batch arrival updates all eligible shipments.
* Shipments are sorted according to their next Journey Steps.
* Shipments can be transferred by scanning the shipment and destination batch.
* Supervisor authorization is required for restricted actions.
* Customers receive simplified timeline updates.
* Email and in-app notifications are sent.
* Guests can track through a secure link.
* Tracking number plus phone works as a fallback.
* Delivery PIN verification works.
* Required proof-of-delivery evidence works.
* Government-ID evidence remains restricted.
* Team Members can use the Android mobile app.
* Core scan actions work with temporary loss of internet.
* Offline synchronization is idempotent.
* Company data remains isolated.
* Platform usage records support manual contract review.
* English, Amharic, and Afaan Oromo localization infrastructure works.
* Automated critical tests pass.
* Deployment and operating documentation are complete.

---

# 50. Final Engineering Instructions

Prioritize correctness, tenant isolation, operational simplicity, and traceability.

Do not make the interface complicated merely because the underlying workflow is sophisticated.

Use explicit state machines rather than scattered Boolean fields.

Use transactions for:

* Shipment activation
* Batch departure
* Batch arrival
* Shipment transfer
* Delivery completion
* Payment updates
* Journey changes

Use idempotency protection for:

* QR scan actions
* Bulk batch updates
* Offline synchronization
* Notifications
* Shipment activation
* Delivery completion

Keep customer-facing statuses simple.

Keep operational events minimal but sufficient for accountability.

Do not add a Driver model.

Do not add inter-company transfers.

Do not add online payments.

Do not add multi-package requests.

Do not add a public marketplace.

Build the complete MVP as a coherent working product rather than a collection of visual prototypes.
