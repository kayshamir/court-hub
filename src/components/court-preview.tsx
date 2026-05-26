import React from "react";
import { View, Text } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import { SportType, SPORT_CONFIGS } from "@/types/court";

interface CourtPreviewProps {
  sportType: SportType;
}

function TennisLines({ w, h }: { w: number; h: number }) {
  const stroke = "rgba(255,255,255,0.85)";
  const strokeThin = "rgba(255,255,255,0.55)";
  const sw = 1.5;
  // Percentages mapped to absolute coords
  const left = w * 0.12;
  const right = w * 0.88;
  const top = h * 0.0;
  const bottom = h * 1.0;
  const midY = h * 0.5;
  const svcTop = h * 0.2;
  const svcBot = h * 0.8;
  const midX = w * 0.5;

  return (
    <>
      {/* Outer boundary */}
      <Rect x={1} y={1} width={w - 2} height={h - 2} fill="none" stroke={stroke} strokeWidth={sw} />
      {/* Net line */}
      <Line x1={0} y1={midY} x2={w} y2={midY} stroke={stroke} strokeWidth={sw + 0.5} />
      {/* Doubles alleys */}
      <Line x1={left} y1={top} x2={left} y2={bottom} stroke={strokeThin} strokeWidth={sw} />
      <Line x1={right} y1={top} x2={right} y2={bottom} stroke={strokeThin} strokeWidth={sw} />
      {/* Service boxes top */}
      <Line x1={left} y1={svcTop} x2={right} y2={svcTop} stroke={stroke} strokeWidth={sw} />
      {/* Service boxes bottom */}
      <Line x1={left} y1={svcBot} x2={right} y2={svcBot} stroke={stroke} strokeWidth={sw} />
      {/* Center service line */}
      <Line x1={midX} y1={svcTop} x2={midX} y2={svcBot} stroke={stroke} strokeWidth={sw} />
    </>
  );
}

function PickleballLines({ w, h }: { w: number; h: number }) {
  const stroke = "rgba(255,255,255,0.85)";
  const strokeThin = "rgba(255,255,255,0.55)";
  const sw = 1.5;
  const midY = h * 0.5;
  const midX = w * 0.5;
  // NVZ (kitchen) = 35% from each end
  const nvzTop = h * 0.3;
  const nvzBot = h * 0.7;

  return (
    <>
      {/* Outer boundary */}
      <Rect x={1} y={1} width={w - 2} height={h - 2} fill="none" stroke={stroke} strokeWidth={sw} />
      {/* Net */}
      <Line x1={0} y1={midY} x2={w} y2={midY} stroke={stroke} strokeWidth={sw + 0.5} />
      {/* NVZ lines */}
      <Line x1={0} y1={nvzTop} x2={w} y2={nvzTop} stroke={stroke} strokeWidth={sw} />
      <Line x1={0} y1={nvzBot} x2={w} y2={nvzBot} stroke={stroke} strokeWidth={sw} />
      {/* Center line (only outside NVZ) */}
      <Line x1={midX} y1={0} x2={midX} y2={nvzTop} stroke={strokeThin} strokeWidth={sw} />
      <Line x1={midX} y1={nvzBot} x2={midX} y2={h} stroke={strokeThin} strokeWidth={sw} />
    </>
  );
}

function BadmintonLines({ w, h }: { w: number; h: number }) {
  const stroke = "rgba(255,255,255,0.85)";
  const strokeThin = "rgba(255,255,255,0.55)";
  const sw = 1.5;
  const midY = h * 0.5;
  const midX = w * 0.5;
  // Inner boundary inset 8%
  const inset = 0.08;
  const iLeft = w * inset;
  const iRight = w * (1 - inset);
  const iTop = h * inset;
  const iBottom = h * (1 - inset);
  // Short service line 35% from net
  const sslTop = h * 0.35;
  const sslBot = h * 0.65;
  // Long service (doubles) 10% from baseline
  const lslTop = h * 0.1;
  const lslBot = h * 0.9;

  return (
    <>
      {/* Outer boundary */}
      <Rect x={1} y={1} width={w - 2} height={h - 2} fill="none" stroke={stroke} strokeWidth={sw} />
      {/* Inner boundary (singles) */}
      <Rect x={iLeft} y={iTop} width={iRight - iLeft} height={iBottom - iTop} fill="none" stroke={strokeThin} strokeWidth={sw} />
      {/* Net */}
      <Line x1={0} y1={midY} x2={w} y2={midY} stroke={stroke} strokeWidth={sw + 0.5} />
      {/* Center line */}
      <Line x1={midX} y1={iTop} x2={midX} y2={iBottom} stroke={strokeThin} strokeWidth={sw} />
      {/* Short service lines */}
      <Line x1={iLeft} y1={sslTop} x2={iRight} y2={sslTop} stroke={stroke} strokeWidth={sw} />
      <Line x1={iLeft} y1={sslBot} x2={iRight} y2={sslBot} stroke={stroke} strokeWidth={sw} />
      {/* Long service lines (doubles back boundary) */}
      <Line x1={0} y1={lslTop} x2={w} y2={lslTop} stroke={strokeThin} strokeWidth={sw} />
      <Line x1={0} y1={lslBot} x2={w} y2={lslBot} stroke={strokeThin} strokeWidth={sw} />
    </>
  );
}

interface CourtCanvasProps {
  sportType: SportType;
  children?: React.ReactNode;
  aspectRatio?: number;
  className?: string;
}

export function CourtCanvas({
  sportType,
  children,
  aspectRatio = 16 / 10,
  className = "",
}: CourtCanvasProps) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  return (
    <View
      className={`w-full bg-court-green rounded-2xl overflow-hidden border-2 border-white relative ${className}`}
      style={{ aspectRatio }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ width, height });
      }}
    >
      {size.width > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {sportType === "tennis" && (
            <TennisLines w={size.width} h={size.height} />
          )}
          {sportType === "pickleball" && (
            <PickleballLines w={size.width} h={size.height} />
          )}
          {sportType === "badminton" && (
            <BadmintonLines w={size.width} h={size.height} />
          )}
        </Svg>
      )}
      {children}
    </View>
  );
}

export function CourtPreview({ sportType }: CourtPreviewProps) {
  const config = SPORT_CONFIGS[sportType];

  return (
    <View className="w-full bg-secondary rounded-3xl overflow-hidden border border-black/5">
      {/* Header bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-black/5">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-live-indicator" />
          <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
            Live Preview
          </Text>
        </View>
        <Text className="text-[11px] font-bold text-muted-foreground font-mono">
          {config.dimensions}
        </Text>
      </View>

      {/* Court canvas */}
      <View className="p-4 bg-black/5 dark:bg-white/5">
        <CourtCanvas sportType={sportType} aspectRatio={16 / 10} />
      </View>
    </View>
  );
}
