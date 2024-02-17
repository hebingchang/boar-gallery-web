import useDarkMode from "use-dark-mode";
import sonyLogo from '../assets/SONY.svg';
import sonyLogoDark from '../assets/SONY_dark.svg';
import sigmaLogo from '../assets/SIGMA.svg';
import sigmaLogoDark from '../assets/SIGMA_dark.svg';

const logos: { [k: string]: { light: string, dark: string } } = {
  'SONY': {
    light: sonyLogo,
    dark: sonyLogoDark,
  },
  'SIGMA': {
    light: sigmaLogo,
    dark: sigmaLogoDark,
  }
}

export interface ManufactureIconProps {
  name: string
}

export default function ManufactureIcon(props: ManufactureIconProps) {
  const darkmode = useDarkMode()
  const manufacture = logos[props.name]

  if (!manufacture) return props.name

  return (
    <img alt={props.name} src={darkmode.value ? manufacture.dark : manufacture.light} className='h-[0.7rem] mr-2 inline'/>
  );
}
