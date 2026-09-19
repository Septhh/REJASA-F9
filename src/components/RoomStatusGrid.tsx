import React from 'react';
import { LabRoom } from '../types';

interface RoomStatusGridProps {
  rooms: LabRoom[];
  onSelectRoom?: (room: LabRoom) => void;
  onOpenIncidentForRoom?: (roomCode: string) => void;
}

export const RoomStatusGrid: React.FC<RoomStatusGridProps> = ({
  rooms,
  onSelectRoom,
  onOpenIncidentForRoom,
}) => {
  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#9E1B32] text-[20px]">sensors</span>
          <h2 className="font-['Plus_Jakarta_Sans'] text-base sm:text-lg font-bold text-[#131b2e] tracking-tight">
            Status Operasional Bilik Laboratorium
          </h2>
          <span className="text-xs text-slate-400 hidden md:inline font-mono">
            (Node sync realtime via QR Check-In)
          </span>
        </div>
        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-[2px] w-fit">
          SOP-LAB-019 REV 4
        </span>
      </div>

      {/* 5 Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {rooms.map((room) => {
          const isProblem = room.statusType === 'problem';
          const isSuccess = room.statusType === 'reviewed';
          const isActive = room.statusType === 'active';
          const isStandby = room.statusType === 'standby';

          return (
            <div
              key={room.id}
              id={`room-card-${room.code.toLowerCase()}`}
              onClick={() => onSelectRoom && onSelectRoom(room)}
              className={`bg-white rounded-[2px] p-4 shadow-xs border transition-colors flex flex-col justify-between ${
                isProblem
                  ? 'border-rose-300 hover:border-rose-400'
                  : 'border-slate-300 hover:border-slate-400'
              } ${isStandby ? 'opacity-90' : ''}`}
            >
              <div>
                {/* Room top badges */}
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`px-1.5 py-0.5 rounded-[2px] font-mono text-[11px] font-bold border ${
                      room.code === 'BIO'
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : room.code === 'FIS'
                        ? 'bg-sky-50 text-sky-900 border-sky-200'
                        : room.code === 'KIM'
                        ? 'bg-teal-50 text-teal-900 border-teal-200'
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    {room.badgeCode}
                  </span>

                  {isProblem && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-700 px-1.5 py-0.5 rounded-[2px] bg-rose-50 border border-rose-200">
                      <span className="w-1.5 h-1.5 bg-rose-600"></span>
                      INSIDEN
                    </span>
                  )}
                  {isSuccess && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 px-1.5 py-0.5 rounded-[2px] bg-emerald-50 border border-emerald-200">
                      <span className="w-1.5 h-1.5 bg-emerald-600"></span>
                      BERJALAN
                    </span>
                  )}
                  {isActive && (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#9E1B32] px-1.5 py-0.5 rounded-[2px] bg-[#FFF1F2] border border-[#FECDD3]">
                      <span className="w-1.5 h-1.5 bg-[#9E1B32]"></span>
                      PRAKTIKUM
                    </span>
                  )}
                  {isStandby && (
                    <span className="text-[11px] font-mono font-bold text-slate-500 px-1.5 py-0.5 rounded-[2px] bg-slate-100 border border-slate-200">
                      STANDBY
                    </span>
                  )}
                </div>

                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#131b2e] truncate">
                  {room.name}
                </h3>

                {/* Information lines */}
                <div className="mt-2 space-y-1">
                  {room.className && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">
                        group
                      </span>
                      <span className="font-semibold text-slate-900 truncate">
                        {room.className}
                      </span>
                    </p>
                  )}
                  {room.topic && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">
                        {isStandby ? 'laptop_chromebook' : room.code.includes('FIS') ? 'bolt' : 'science'}
                      </span>
                      <span className="truncate">{room.topic}</span>
                    </p>
                  )}
                  {room.teacher && (
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-slate-400">
                        {room.teacher.startsWith('Sesi') ? 'schedule' : 'person'}
                      </span>
                      <span className="truncate">{room.teacher}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom footer status strip */}
              <div
                className={`mt-3 pt-2 -mx-4 -mb-4 p-2.5 flex items-center justify-between border-t ${
                  isProblem
                    ? 'bg-rose-50/80 hover:bg-rose-100 border-rose-200 cursor-pointer'
                    : isSuccess
                    ? 'bg-emerald-50/50 border-slate-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
                onClick={(e) => {
                  if (isProblem && onOpenIncidentForRoom) {
                    e.stopPropagation();
                    onOpenIncidentForRoom(room.code);
                  }
                }}
              >
                <span
                  className={`text-xs font-semibold truncate flex items-center gap-1 ${
                    isProblem
                      ? 'text-rose-700'
                      : isSuccess
                      ? 'text-emerald-700'
                      : isActive
                      ? 'text-slate-800'
                      : 'text-slate-500 font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isProblem
                      ? 'warning'
                      : isSuccess
                      ? 'check_circle'
                      : isActive
                      ? 'timer'
                      : room.statusDetailType === 'info' && room.actionLabel === 'Kunci'
                      ? 'verified'
                      : 'lock_clock'}
                  </span>
                  <span className="truncate">{room.statusDetail}</span>
                </span>

                {room.actionLabel ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectRoom) onSelectRoom(room);
                    }}
                    className="text-[#9E1B32] text-xs font-mono font-bold hover:underline ml-1"
                  >
                    [{room.actionLabel}]
                  </button>
                ) : (
                  <span
                    className={`material-symbols-outlined text-[16px] ${
                      isProblem
                        ? 'text-rose-600'
                        : isSuccess
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    chevron_right
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
