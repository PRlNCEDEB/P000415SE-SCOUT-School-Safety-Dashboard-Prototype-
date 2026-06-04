@notifications
Feature: Notifications

  @SCRUM-T70
  Scenario: School Admin can access the Notifications page
    Given I am logged in as "School Admin"
    When I navigate to "/notifications"
    Then the Notifications page loads
    And I see summary cards: Total Sent, Failed, SMS Failed, Email Failed

  @SCRUM-T71
  Scenario: Staff is redirected from the Notifications page
    Given I am logged in as "Staff"
    When I navigate to "/notifications"
    Then I am redirected away from "/notifications"

  @SCRUM-T72
  Scenario: Each notification entry shows channel recipient and status
    Given I am logged in as "School Admin"
    And notification records exist in Firestore
    When I view the Notifications page
    Then each row shows the incident title, recipient name, recipient email, timestamp, SMS status badge, and email status badge

  @SCRUM-T73
  Scenario: Filter by SMS channel works
    Given I am logged in as "School Admin"
    And notification records exist
    When I select "SMS Only" from the channel filter
    Then I see only SMS-related notifications

  @SCRUM-T74
  Scenario: Filter by Failed status works
    Given I am logged in as "School Admin"
    And at least one failed notification exists
    When I select "Failed" from the status filter
    Then I see only notifications with failed SMS or email status

  @SCRUM-T75
  Scenario: Failed notification warning banner is visible when failures exist
    Given at least one failed notification exists
    And I am logged in as "School Admin"
    When I view the Notifications page
    Then I see a red warning banner showing the number of failed notifications

  @SCRUM-T76
  Scenario: Notifications Refresh button reloads data
    Given I am logged in as "School Admin"
    And I am on the Notifications page
    When I click the Refresh button
    Then the notification records are re-fetched and updated

  @SCRUM-T77
  Scenario: Alert email contains type location and timestamp
    Given an emergency notification has been triggered
    When the recipient opens the received email
    Then the email body contains the alert type, location, and date/time timestamp
    And an Acknowledge button linking to "/api/notifications/acknowledge/:token" is present

  @SCRUM-T78
  Scenario: Acknowledge link marks the notification as acknowledged
    Given a recipient has received an emergency alert email with a valid unacknowledged token
    When the recipient clicks the Acknowledge Alert button
    Then the browser shows a "Response Confirmed" page with the recipient name and incident title
    And the notification record in Firestore has acknowledged set to true and acknowledgedAt populated
    And the linked incident acknowledgedBy array is updated and status is changed to acknowledged

  @SCRUM-T79
  Scenario: Clicking an already-acknowledged link shows Already Acknowledged page
    Given a notification token has already been acknowledged
    When I navigate to the acknowledge link again
    Then I see the "Already Acknowledged" page
    And the record is not duplicated

  @SCRUM-T80
  Scenario: Invalid acknowledge token shows error page
    When I navigate to the acknowledge url "/api/notifications/acknowledge/invalid-token-abc"
    Then I see the "Invalid Link" error page

  @SCRUM-T81
  Scenario: Failed notifications are visible on the Notifications page
    Given failed notification records exist in Firestore
    And I am logged in as "School Admin"
    When I view the Notifications page
    Then failed notifications appear with a red failed badge
    And the Failed summary card shows the correct count
