import { Show } from '@/components/show'
import { thumbnailUrl } from '@/lib/parties'

type Props = {
  imageUrl: string | null,
  /** Party name; its first letter stands in when there is no flyer. */
  name: string,
}

/** The party's flyer as a square thumbnail, or its initial when there is none. */
export function Flyer({ imageUrl, name }: Props) {
  return (
    <Show
      when={imageUrl !== null}
      fallback={
        <div
          aria-hidden
          className="flex aspect-square items-center justify-center rounded-md bg-ink text-4xl font-extrabold text-band-yellow [font-stretch:75%]"
        >
          {name.charAt(0)}
        </div>
      }
    >
      <img
        src={thumbnailUrl(imageUrl ?? '')}
        alt=""
        loading="lazy"
        className="aspect-square w-full rounded-md bg-muted object-cover"
      />
    </Show>
  )
}
