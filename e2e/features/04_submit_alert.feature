@alerts
Feature: Submit Alert

  Scenario: Staff submits a valid alert with all required fields
    Given I am logged in as "Staff"
    And I am on the Submit Alert page
    When I select alert type "Medical"
    And I select priority "High"
    And I enter title "Student collapsed in Block A"
    And I select location "Block A"
    And I click Submit Alert
    Then I see a confirmation message
    And an incident is created with type "medical", priority "high", location "Block A", and an auto-generated timestamp

  Scenario: Validation errors appear when required fields are empty
    Given I am logged in as "Staff"
    And I am on the Submit Alert page
    When I click Submit Alert without filling any fields
    Then I see validation errors for Type, Priority, Title, and Location
    And no API call is made

  Scenario: Description field is optional on Submit Alert
    Given I am logged in as "Staff"
    And I am on the Submit Alert page
    When I fill in type, priority, title, and location but leave description blank
    And I click Submit Alert
    Then the alert is submitted successfully
    And no validation error is shown for description

  Scenario Outline: All alert types are selectable
    Given I am logged in as "Staff"
    And I am on the Submit Alert page
    When I click the alert type button "<type>"
    Then the "<type>" button is highlighted with a red border
    And no other type button is highlighted

    Examples:
      | type        |
      | medical     |
      | fire        |
      | lockdown    |
      | behaviour   |
      | weather     |
      | maintenance |
      | general     |

  Scenario Outline: All priority levels are selectable
    Given I am logged in as "Staff"
    And I am on the Submit Alert page
    When I click the priority button "<priority>"
    Then the "<priority>" button is highlighted
    And no other priority button is highlighted

    Examples:
      | priority |
      | critical |
      | high     |
      | medium   |
      | low      |

  Scenario: Company Admin does not see Submit Alert in navigation
    Given I am logged in as "Company Admin"
    Then I do not see a "Submit Alert" link in the navigation

  Scenario: School Admin submits a valid alert
    Given I am logged in as "School Admin"
    And I am on the Submit Alert page
    When I fill all required fields and click Submit Alert
    Then the alert is submitted successfully
    And the incident is linked to the School Admin's school

  Scenario: Submitted alert records type, location, and auto-generated timestamp
    Given a new alert has been submitted
    When I open the created incident detail page
    Then I see the incident type matching the selected type
    And I see the incident location matching the selected location
    And I see an auto-generated timestamp that was not manually entered
    And all three fields are visible on both the list and detail views
