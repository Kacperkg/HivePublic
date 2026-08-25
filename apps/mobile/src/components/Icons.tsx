import Svg, { Path } from "react-native-svg";

type IconProps = { color?: string; size?: number };
const strokeProps = {
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function BackIcon({ color = "white", size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M13 1H1V13M1 1L13 13" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function ArrowUpRightIcon({ color = "white", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 17L17 7M7 7H17V17" stroke={color} {...strokeProps} />
    </Svg>
  );
}

export function ChevronIcon({
  color = "white",
  size = 24,
  direction = "right",
}: IconProps & { direction?: "left" | "right" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={direction === "left" ? "M15 18L9 12L15 6" : "M9 18L15 12L9 6"}
        stroke={color}
        {...strokeProps}
      />
    </Svg>
  );
}

export function LogoutIcon({ color = "white", size = 14 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path d="M13 13V1H1M13 1L1 13" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

export function HomeIcon({ color = "white", size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M2 10.1L11 3L20 10.1V19H14.5V13.5H7.5V19H2V10.1Z"
        stroke={color}
        {...strokeProps}
      />
    </Svg>
  );
}

export function CalendarIcon({ color = "white", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
        stroke={color}
        {...strokeProps}
      />
      <Path
        d="M8 2V6M16 2V6M3 9H21M8 13H10M14 13H16M8 17H10M14 17H16"
        stroke={color}
        {...strokeProps}
      />
    </Svg>
  );
}

export function ReportIcon({ color = "white", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 5H5C3.9 5 3 5.9 3 7V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V7C21 5.9 20.1 5 19 5H17M8 5V3H10C10 1.9 10.9 1 12 1C13.1 1 14 1.9 14 3H16V7H8V5ZM8 12H16M8 16H16M8 20H14"
        stroke={color}
        {...strokeProps}
      />
    </Svg>
  );
}

export function AvatarIcon({ color = "#555", size = 50 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50" fill="none">
      <Path
        d="M25 25C30.5 25 35 20.5 35 15C35 9.5 30.5 5 25 5C19.5 5 15 9.5 15 15C15 20.5 19.5 25 25 25ZM7 47C7 36.5 15 29 25 29C35 29 43 36.5 43 47"
        fill={color}
      />
    </Svg>
  );
}
