@beta-setup
Feature: Beta School Setup Page Functionality

  @SCRUM-T110
  Scenario: Beta Admin can access the Setup page and sees only School Admin sections
    Given I am logged in as "Beta Admin"
    When I navigate to "/setup"
    Then I see the "Alert Recipients" section
    And I do not see a "System-wide Configuration" section
    And I do not see an "Alert Types" configuration section

  @SCRUM-T111
  Scenario: Beta Admin can see and select emergency types in the routing panel
    Given I am logged in as "Beta Admin"
    And I am on the Setup page
    When I select an emergency type from the routing dropdown
    Then I see the current recipients for that alert type
    And I can add school users as recipients

  @SCRUM-T112
  Scenario: Beta Admin can add a school user as a notification recipient and it is saved
    Given I am logged in as "Beta Admin"
    And I am on the Setup page
    When I select an emergency type from the routing dropdown
    And I add the first available school user as a recipient
    Then the recipient appears in the current recipients list
    When I reload the Setup page
    And I select the same emergency type from the routing dropdown
    Then the recipient is still shown in the recipients list

  @SCRUM-T113
  Scenario: Beta Admin routing changes do not affect Gamma Admin view
    Given I am logged in as "Beta Admin"
    And I am on the Setup page
    When I select an emergency type from the routing dropdown
    And I record the Beta recipient count for that type
    When I log in as "Gamma Admin"
    And I am on the Setup page
    And I select an emergency type from the routing dropdown
    Then the Gamma recipient list is independent of Beta School routing
