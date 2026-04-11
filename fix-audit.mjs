import fs from 'fs';

const content = fs.readFileSync('src/components/nychiq/onboarding-audit.tsx', 'utf8');

// Find exact position of the Channel Profile section
const startIdx = content.indexOf('{/* Channel Profile Card with avatar */');
const endIdx = content.indexOf('{/* Stats pills */');

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find sections to replace');
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

// Build new Channel Profile section using an IIFE pattern to avoid TSX parser ambiguity
const replacement = [
  '              {/* Channel Profile */',
  '              {(() => {',
  '                if (!channelData) return null;',
  '                return (',
  '                  <div className="rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] p-5 mb-6">',
  '                    <div className="flex items-center gap-4">',
  '                      {channelData.avatarUrl ? (',
  '                        <img',
  '                          src={channelData.avatarUrl}',
  '                          alt={channelData.name}',
  '                          className="w-16 h-16 rounded-full object-cover border-2 border-[#FDBA2D]/40"',
  '                        />',
  '                      ) : (',
  '                        <div className="w-16 h-16 rounded-full bg-[rgba(253,186,45,0.15)] border-2 border-[#FDBA2D]/40 flex items-center justify-center text-xl font-bold text-[#FDBA2D]">',
  '                          {(channelData.name || \'M\').charAt(0).toUpperCase()}',
  '                        </div>',
  '                      )}',
  '                      <div className="flex-1 min-w-0">',
  '                        <h3 className="text-base font-bold text-[#E8E8E8] truncate">{channelData.name || \'Channel\'}</h3>',
  '                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">',
  '                          <span className="text-xs text-[#888888] flex items-center gap-1.5">',
  '                            <Users className="w-3.5 h-3.5" /> {fmtV(channelData.subscribers)} subs',
  '                          </span>',
  '                          <span className="text-xs text-[#888888] flex items-center gap-1.5">',
  '                            <Video className="w-3.5 h-3.5" /> {fmtV(channelData.videoCount)} videos',
  '                          </span>',
  '                          <span className="text-xs text-[#888888] flex items-center gap-1.5">',
  '                            <Eye className="w-3.5 h-3.5" /> {fmtV(channelData.totalViews)} views',
  '                          </span>',
  '                        </div>',
  '                      </div>',
  '                    </div>',
  '                  </div>',
  '                );',
  '              })()}',
  '',
].join('\n');

const newContent = before + replacement + after;
fs.writeFileSync('src/components/nychiq/onboarding-audit.tsx', newContent, 'utf8');
console.log('File rewritten successfully, size:', newContent.length);
