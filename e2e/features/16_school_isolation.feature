@isolation
Feature: School Data Isolation Between Beta and Gamma Schools

  Scenario: Beta Admin Analytics is scoped to Beta School only
    Given I am logged in as "Beta Admin"
    When I view the Analytics page
    Then I see a school scope banner with text "Beta School"

  Scenario: Gamma Admin Analytics is scoped to Gamma School only
    Given I am logged in as "Gamma Admin"
    When I view the Analytics page
    Then I see a school scope banner with text "Gamma School"

  Scenario: Beta and Gamma Admins see different Analytics totals
    Given I am logged in as "Beta Admin"
    When I view the Analytics page
    And I record the Total Incidents summary value as "beta total"
    And I log in as "Gamma Admin"
    And I view the Analytics page
    Then the Total Incidents value is recorded as "gamma total"
    And both schools show their respective school name in the scope banner

  Scenario: Incident submitted by Beta Staff is visible to Beta Admin
    Given a fresh alert is submitted by "Beta Staff" with title "Beta School Isolation Marker"
    When I log in as "Beta Admin"
    And I navigate to "/incidents"
    Then I see an incident with title "Beta School Isolation Marker"

  Scenario: Incident submitted by Beta Staff is NOT visible to Gamma Admin
    Given a fresh alert is submitted by "Beta Staff" with title "Gamma Isolation Check"
    When I log in as "Gamma Admin"
    And I navigate to "/incidents"
    Then I do not see an incident with title "Gamma Isolation Check"

  Scenario: Beta Admin does not see Gamma School incidents on the Incidents page
    Given a fresh alert is submitted by "Gamma Staff" with title "Gamma Only Incident"
    When I log in as "Beta Admin"
    And I navigate to "/incidents"
    Then I do not see an incident with title "Gamma Only Incident"
