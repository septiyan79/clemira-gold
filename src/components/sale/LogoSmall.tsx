import Image from "next/image";

export default function LogoSmall() {
  return <Image src="/Logo CG.png" alt="Clemira Gold" width={20} height={20} style={{ objectFit: "contain" }} />;
}
