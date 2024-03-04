import sonyAlpha from '../assets/logos/Sony_Alpha_logo.svg';
import lumix from '../assets/logos/Lumix_logo.svg';
import lumixDark from '../assets/logos/Lumix_logo_dark.svg';
import { Camera } from "../models/gallery.ts";
import useDarkMode from "use-dark-mode";
import { Tooltip } from "@nextui-org/react";

export interface CameraNameProps {
  camera?: Camera
}

export default function CameraName(props: CameraNameProps) {
  const darkmode = useDarkMode()

  if (!props.camera) return;
  if (!props.camera?.general_name) return props.camera?.model

  let cameraName: JSX.Element

  if (props.camera.manufacture.name === 'SONY' && props.camera.general_name.startsWith('α')) {
    cameraName = <Tooltip content={props.camera.model}>
      <div className='flex items-center'>
        <img alt='α' src={sonyAlpha} className='h-[0.7rem] mr-1 inline'/>
        {props.camera.general_name.replace('α', '')}
      </div>
    </Tooltip>
  } else if (props.camera.manufacture.name === 'Panasonic' && props.camera.general_name.startsWith('Lumix')) {
    cameraName = <Tooltip content={props.camera.model}>
      <div className='flex items-center'>
        <img alt='Lumix' src={darkmode.value ? lumixDark : lumix} className='h-[0.8rem] mr-1 inline'/>
        {props.camera.general_name.replace('Lumix', '')}
      </div>
    </Tooltip>
  } else {
    cameraName = <span>{props.camera.general_name}</span>
  }

  return cameraName;
}
