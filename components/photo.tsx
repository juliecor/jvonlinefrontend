import Image, { type ImageProps } from "next/image"

/**
 * Where the site's image optimizer may fetch photos from: Johndorf's photo
 * folder on S3 (next.config.ts allows the same) and the site's own files.
 * Anything else (a local dev upload, another site) is shown as it is.
 */
const S3 = "https://filipinohomes123.s3.ap-southeast-1.amazonaws.com/jvconline/"
const resizable = (src: string) => !src.includes("?") && ((src.startsWith("/") && !src.startsWith("//")) || src.startsWith(S3))

/**
 * A photo, resized to the size it's shown at (WebP, from the original on S3)
 * and loaded only when it's about to come into view. A drop-in for <img>:
 * the classes still size it. sizes says how wide it's shown (e.g.
 * "(min-width: 1024px) 33vw, 100vw"), so phones never fetch the 2,000-pixel
 * original. Photos at the top of a page pass loading="eager".
 */
export function Photo({ src, alt = "", sizes, ...props }: Omit<ImageProps, "src" | "alt" | "width" | "height" | "fill" | "sizes"> & { src: string; alt?: string; sizes: string }) {
  return <Image src={src} alt={alt} sizes={sizes} width={1600} height={1000} unoptimized={!resizable(src)} {...props} />
}
