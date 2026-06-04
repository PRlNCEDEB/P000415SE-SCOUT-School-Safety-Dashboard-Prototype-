@ux
Feature: UX

  @SCRUM-T88
  Scenario: No tooltips or onboarding flows present in any role view
    Given I log in as each of the three roles
    When I navigate through all accessible pages for each role
    Then I do not see any tooltips, popovers, onboarding flows, guided tours, or help overlays on any page
