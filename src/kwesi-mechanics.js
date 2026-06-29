/**
 * Kwesi — non-combat clerk gameplay constants.
 * Phase IV only. Espionage role (formerly spec'd under Kojo).
 * Full spec: docs/characters/kwesi-clerk.md
 */

export const KWESI_ID = 'kwesi';

export const KWESI_COMBAT = {
  canEquipWeapons: false,
  canFireWeapons: false,
  canMelee: false,
  status: 'non_combatant',
};

export const KWESI_EQUIPMENT = [
  'messenger_satchel',
  'forged_papers',
  'wirecutters',
  'ledger_notebook',
];

export const KWESI_SYSTEMS = {
  INTERCEPTOR: 'interceptor',
  MEDIATOR: 'mediator',
  INFORMATION_FETCHER: 'information_fetcher',
};

export const KWESI_ABILITIES = {
  wiretap: { system: KWESI_SYSTEMS.INTERCEPTOR, reveals: ['guard_positions', 'sight_cones', 'patrol_routes'] },
  phony_dispatch: { system: KWESI_SYSTEMS.INTERCEPTOR, effects: ['redirect_patrol', 'trap_alley'] },
  civilian_masking: { system: KWESI_SYSTEMS.MEDIATOR, requires: ['satchel_equipped', 'outside_red_zone'] },
  crisis_mediation: { system: KWESI_SYSTEMS.MEDIATOR, ui: 'timed_dialogue' },
  document_vault: { system: KWESI_SYSTEMS.INFORMATION_FETCHER, targets: ['filing_cabinet', 'registry_desk', 'post_office_vault', 'police_manifest'] },
  narrow_crawl: { system: KWESI_SYSTEMS.INFORMATION_FETCHER, allows: ['vent_routes', 'under_desk_hide'] },
  strategic_prephase: { system: KWESI_SYSTEMS.INFORMATION_FETCHER, persists: 'campaign' },
};

export const KWESI_PRE_PHASE_INTEL = {
  police_manifests: { effect: 'curfew_window_extended', label: 'Curfew patrol timing revealed' },
  warehouse_blueprints: { effect: 'weak_points_highlighted', label: 'Structural weak points for squad' },
  prison_transport: { effect: 'rescue_route_unlocked', label: 'Transport schedule intercepted' },
};

export const KWESI_RESCUE = {
  captureTimerSec: 45,
  states: ['undetected', 'suspicious', 'spotted', 'capture_pending', 'captured'],
  extractRoles: ['kojo', 'araba', 'kofi'],
};

export const KWESI_INPUT = {
  desktop: {
    stealthMove: ['KeyW', 'KeyA', 'KeyS', 'KeyD'],
    crouchHide: 'ControlLeft',
    interactIntel: 'KeyE',
    interceptionHack: 'KeyQ',
    phonyDispatch: 'Tab',
    mediationChoice: ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
  },
  mobile: {
    stealthMove: 'joystick',
    crouchHide: 'low_profile_toggle',
    interactIntel: 'tap_hold_radial',
    interceptionHack: 'wire_trace_minigame',
    phonyDispatch: 'dispatch_swipe_ui',
    mediationChoice: 'dialogue_touch_buttons',
  },
};

export function isNonCombatSupport(characterId) {
  return characterId === KWESI_ID;
}

export function canCharacterFire(characterId) {
  return !isNonCombatSupport(characterId);
}

export function kwesiMaskingActive(kwesiState, inRedZone) {
  if (inRedZone) return false;
  return kwesiState?.satchelEquipped !== false;
}
