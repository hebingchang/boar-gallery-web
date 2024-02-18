import useDarkMode from "use-dark-mode";
import sonyLogo from '../assets/SONY.svg';
import sonyLogoDark from '../assets/SONY_dark.svg';
import sigmaLogo from '../assets/SIGMA.svg';
import sigmaLogoDark from '../assets/SIGMA_dark.svg';
import appleLogo from '../assets/Apple.svg';
import appleLogoDark from '../assets/Apple_dark.svg';

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
    style: 'h-[1rem]',
  },
}

export interface ManufactureIconProps {
  name: string
}

export default function ManufactureIcon(props: ManufactureIconProps) {
  const darkmode = useDarkMode()
  const manufacture = logos[props.name]

  if (!manufacture) return props.name

  return (
    <img alt={props.name} src={darkmode.value ? manufacture.dark : manufacture.light}
         className={`${manufacture.style} mr-2 inline`}/>
  );
}
