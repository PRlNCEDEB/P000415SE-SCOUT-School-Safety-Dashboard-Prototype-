import { describe, it, expect } from 'vitest'
import { applyRecipientPhone, findAlertTypesForRecipient } from '../utils/routingRecipients'

// Routing rules store a snapshot of each recipient's phone. These tests pin the behaviour that a phone edit reaches every alert type the person is routed to the previous code only updated the alert type on screen, so SMS for other lert types kept the stale number.

const ROUTING = {
  Fire: [
    { name: 'Beta Staff', email: 'staff.beta@scout.edu', phone: null, notify: 'both' },
    { name: 'Someone Else', email: 'other@scout.edu', phone: '+61400000001', notify: 'email' },
  ],
  Threat: [
    { name: 'Beta Staff', email: 'staff.beta@scout.edu', phone: null, notify: 'sms' },
  ],
  'Natural Disaster': [
    { name: 'Someone Else', email: 'other@scout.edu', phone: '+61400000001', notify: 'email' },
  ],
}

describe('findAlertTypesForRecipient', () => {
  it('finds every alert type the person is routed to', () => {
    expect(findAlertTypesForRecipient(ROUTING, 'staff.beta@scout.edu').sort())
      .toEqual(['Fire', 'Threat'])
  })

  it('matches regardless of case and surrounding whitespace', () => {
    expect(findAlertTypesForRecipient(ROUTING, '  STAFF.BETA@SCOUT.EDU ').sort())
      .toEqual(['Fire', 'Threat'])
  })

  it('returns nothing for someone who is not routed anywhere', () => {
    expect(findAlertTypesForRecipient(ROUTING, 'nobody@scout.edu')).toEqual([])
  })

  it('returns nothing for a missing email', () => {
    expect(findAlertTypesForRecipient(ROUTING, null)).toEqual([])
    expect(findAlertTypesForRecipient(ROUTING, '')).toEqual([])
    expect(findAlertTypesForRecipient(ROUTING, '   ')).toEqual([])
  })
})

describe('applyRecipientPhone', () => {
  it('updates the person in EVERY alert type, not just one', () => {
    const updates = applyRecipientPhone(ROUTING, 'staff.beta@scout.edu', '+61411222333')

    expect(Object.keys(updates).sort()).toEqual(['Fire', 'Threat'])
    expect(updates.Fire[0].phone).toBe('+61411222333')
    expect(updates.Threat[0].phone).toBe('+61411222333')
  })

  it('leaves other recipients in the same rule untouched', () => {
    const updates = applyRecipientPhone(ROUTING, 'staff.beta@scout.edu', '+61411222333')

    expect(updates.Fire[1]).toEqual(ROUTING.Fire[1])
  })

  it('does not touch alert types the person is not routed to', () => {
    const updates = applyRecipientPhone(ROUTING, 'staff.beta@scout.edu', '+61411222333')

    expect(updates['Natural Disaster']).toBeUndefined()
  })

  it('preserves the notify preference on the updated recipient', () => {
    const updates = applyRecipientPhone(ROUTING, 'staff.beta@scout.edu', '+61411222333')

    expect(updates.Fire[0].notify).toBe('both')
    expect(updates.Threat[0].notify).toBe('sms')
  })

  it('does not mutate the original routing object', () => {
    const snapshot = JSON.parse(JSON.stringify(ROUTING))
    applyRecipientPhone(ROUTING, 'staff.beta@scout.edu', '+61411222333')

    expect(ROUTING).toEqual(snapshot)
  })

  it('skips alert types where the phone is already correct', () => {
    // Avoids writing rules back to the server for no reason.
    const already = { Fire: [{ email: 'a@b.c', phone: '+61400000009' }] }

    expect(applyRecipientPhone(already, 'a@b.c', '+61400000009')).toEqual({})
  })

  it('supports clearing a phone number back to null', () => {
    const withPhone = { Fire: [{ email: 'a@b.c', phone: '+61400000009' }] }
    const updates = applyRecipientPhone(withPhone, 'a@b.c', null)

    expect(updates.Fire[0].phone).toBeNull()
  })

  it('returns nothing for a missing email rather than rewriting everyone', () => {
    expect(applyRecipientPhone(ROUTING, undefined, '+61411222333')).toEqual({})
    expect(applyRecipientPhone(ROUTING, '', '+61411222333')).toEqual({})
  })

  it('ignores recipients that have no email', () => {
    const messy = { Fire: [{ name: 'No Email', phone: null }, { email: 'a@b.c', phone: null }] }
    const updates = applyRecipientPhone(messy, 'a@b.c', '+614')

    expect(updates.Fire[0]).toEqual({ name: 'No Email', phone: null })
    expect(updates.Fire[1].phone).toBe('+614')
  })

  it('tolerates empty, missing and malformed routing entries', () => {
    expect(applyRecipientPhone({}, 'a@b.c', '+614')).toEqual({})
    expect(applyRecipientPhone(null, 'a@b.c', '+614')).toEqual({})
    expect(applyRecipientPhone({ Fire: null, Threat: undefined }, 'a@b.c', '+614')).toEqual({})
  })
})
