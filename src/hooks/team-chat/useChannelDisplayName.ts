import type { ChannelWithMembership } from './useChatChannels';

/**
 * Get the display name for a channel.
 * For DM channels, shows the partner's name instead of the internal channel name.
 * For other channels, returns the channel name as-is.
 */
export function getChannelDisplayName(channel: ChannelWithMembership): string {
  if ((channel.type === 'dm' || channel.type === 'group_dm') && channel.dm_partner) {
    return channel.dm_partner.display_name;
  }
  return channel.name;
}

/**
 * Get the display icon/avatar for a channel.
 * For DM channels, can use the partner's photo.
 */
export function getChannelAvatarUrl(channel: ChannelWithMembership): string | null {
  if ((channel.type === 'dm' || channel.type === 'group_dm') && channel.dm_partner) {
    return channel.dm_partner.photo_url;
  }
  return null;
}
