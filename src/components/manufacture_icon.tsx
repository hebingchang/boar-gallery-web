import useDarkMode from "use-dark-mode";
import sonyLogo from '../assets/logos/SONY.svg';
import sonyLogoDark from '../assets/logos/SONY_dark.svg';
import sigmaLogo from '../assets/logos/SIGMA.svg';
import sigmaLogoDark from '../assets/logos/SIGMA_dark.svg';
import appleLogo from '../assets/logos/Apple.svg';
import appleLogoDark from '../assets/logos/Apple_dark.svg';
import panasonicLogo from '../assets/logos/Panasonic.svg';
import panasonicLogoDark from '../assets/logos/Panasonic_dark.svg';

const logos: { [k: string]: { light: string, dark: string, style: string } } = {
  'SONY': {
    light: sonyLogo,
    dark: sonyLogoDark,
    style: 'h-[0.7rem]',
  },
  'SIGMA': {
    light: sigmaLogo,
    dark: sigmaLogoDark,
    style: 'h-[0.7rem]',
  },
  'Apple': {
    light: appleLogo,
    dark: appleLogoDark,
    style: 'h-4',
  },
  'Panasonic': {
    light: panasonicLogo,
    dark: panasonicLogoDark,
    style: 'h-[0.7rem]',
  },
}

export interface ManufactureIconProps {
  name?: string
}

export default function ManufactureIcon(props: ManufactureIconProps) {
  const darkmode = useDarkMode()

  if (!props.name) return;

  const manufacture = logos[props.name]
  if (!manufacture) return props.name

  return (
    <img alt={props.name} src={darkmode.value ? manufacture.dark : manufacture.light}
         className={`${manufacture.style} mr-2 inline`}/>
  );
}
