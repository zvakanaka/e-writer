Creates an EPUB file from a JSON object.

```js
import writeEpub from 'e-writer';

await writeEpub({
  title: 'My Book',
  isbn: '1234567890123',
  outFileName: 'my-book.epub',
  creator: 'John Doe',
  authorFirstname: 'John',
  authorSurname: 'Doe',
  content: [
    {
      title: 'Chapter 1',
      content: 'Content of chapter 1.',
    },
    {
      title: 'Chapter 2',
      content: 'Content of chapter 2.',
    },
  ],
})
```

## Todo
- [ ] Images (also custom cover image)
- [ ] Sections (sub-chapters)
- [ ] Custom CSS/fonts
- [ ] Output file as stream/buffer

## Thank You
[Matt Garrish's EPUB3 Samples](https://github.com/IDPF/epub3-samples/tree/main/30/accessible_epub_3)
