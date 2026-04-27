import {
  claimNeed,
  ensureVolunteer,
  getVolunteerByPhone,
  releaseNeed,
  updateVolunteer,
} from '../domain/repo';
import { geocodeLocationHint } from './geocode';
import { logger } from '../lib/logger';
import { NeedTypeSchema, type NeedType, type RawReporter } from '../domain/types';

const ALL_NEED_TYPES = NeedTypeSchema.options.join(', ');

const HELP = [
  'SAHAYA volunteer commands:',
  '  /v register <name>',
  `  /v skills food,water,health    (any of: ${ALL_NEED_TYPES})`,
  '  /v area <location-name>',
  '  /v radius <km>',
  '  /v ready  ·  /v pause',
  '  /v claim <needId>  ·  /v release <needId>',
  '  /v status  ·  /v help',
].join('\n');

function isNeedType(x: string): x is NeedType {
  return (NeedTypeSchema.options as readonly string[]).includes(x);
}

export async function handleVolunteerCommand(
  body: string,
  raw: RawReporter,
): Promise<string> {
  const trimmed = body.trim();
  if (trimmed.length === 0) return HELP;

  const [verb, ...rest] = trimmed.split(/\s+/);
  const arg = rest.join(' ').trim();

  logger.info({ verb, hasArg: arg.length > 0, phone: raw.phone }, 'volunteer cmd');

  switch (verb.toLowerCase()) {
    case 'register': {
      const name = arg || raw.name || `Volunteer ${raw.phone.slice(-4)}`;
      await ensureVolunteer({ raw, name });
      return [
        `🙏 Registered as a SAHAYA volunteer: ${name}`,
        ``,
        `Now set up your profile:`,
        `   /v skills food,water,health`,
        `   /v area Pollachi`,
        `   /v radius 15`,
        `   /v ready    (go live)`,
      ].join('\n');
    }

    case 'skills': {
      if (!arg) return `Usage: /v skills food,water,health\nValid: ${ALL_NEED_TYPES}`;
      const skills = arg
        .split(/[,\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(isNeedType);
      if (skills.length === 0) {
        return `❌ No valid skills recognised. Pick from: ${ALL_NEED_TYPES}`;
      }
      await updateVolunteer(raw.phone, { skills });
      return `✅ Skills set: ${skills.join(', ')}`;
    }

    case 'area': {
      if (!arg) return 'Usage: /v area <location-name>';
      const loc = await geocodeLocationHint(arg);
      if (!loc) return `❌ Couldn't find "${arg}". Try a more specific name.`;
      await updateVolunteer(raw.phone, { serviceArea: loc });
      return `✅ Service area: ${loc.formattedAddress}`;
    }

    case 'radius': {
      const km = Number.parseInt(arg, 10);
      if (!Number.isFinite(km) || km < 1 || km > 100) {
        return '❌ Provide radius in km (1-100). Example: /v radius 15';
      }
      await updateVolunteer(raw.phone, { serviceRadiusKm: km });
      return `✅ Service radius: ${km} km`;
    }

    case 'ready': {
      await updateVolunteer(raw.phone, { active: true });
      return `✅ You're live. We'll WhatsApp you when a matching need is reported nearby.`;
    }

    case 'pause': {
      await updateVolunteer(raw.phone, { active: false });
      return `⏸️ Paused. Use /v ready when you're available again.`;
    }

    case 'claim': {
      if (!arg) return 'Usage: /v claim <needId>';
      const v = await getVolunteerByPhone(raw.phone);
      if (!v) return `❌ Not registered. Use /v register first.`;
      const ok = await claimNeed(arg, v.publicId);
      return ok
        ? `✅ Need ${arg} is yours. When you've handled it, send a photo of the resolution to this chat.`
        : `❌ Need ${arg} not available (already claimed, missing, or wrong status).`;
    }

    case 'release': {
      if (!arg) return 'Usage: /v release <needId>';
      const v = await getVolunteerByPhone(raw.phone);
      if (!v) return `❌ Not registered.`;
      const ok = await releaseNeed(arg, v.publicId);
      return ok ? `🔓 Released ${arg}. It will be re-dispatched.` : `❌ Could not release.`;
    }

    case 'status': {
      const v = await getVolunteerByPhone(raw.phone);
      if (!v) return `❌ Not registered. Try /v register <your name>.`;
      return [
        `Name: ${v.name}`,
        `Skills: ${v.skills.length > 0 ? v.skills.join(', ') : '(none — set with /v skills)'}`,
        `Area: ${v.serviceArea?.formattedAddress ?? '(not set — /v area)'}`,
        `Radius: ${v.serviceRadiusKm} km`,
        `Active: ${v.active ? 'yes' : 'no'}`,
      ].join('\n');
    }

    case 'help':
    default:
      return HELP;
  }
}
