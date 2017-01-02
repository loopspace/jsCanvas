# JS Canvas

The purpose of this project is to provide an arena for learning programming.  The aims that it seeks to fulfil are:

1. The programming language should be a simple written language.
2. The environment should make it easy to do graphical programs.
3. The whole system should work anywhere with no installation.

The third requirement essentially forces a system that works in a
browser with only native capabilities.  The second means that we want
to play around with something graphical, so either `canvas` or `SVG`.
This suggests `javascript` as the answer to the first requirement.  I
originally rejected `javascript` as I don't class it as "simple" and
used a `lua` VM running in `javascript`.  This led to the project
[luaCanvas](https://github.com/loopspace/LuaCanvas).  This worked well
for simple scripts, but managing the memory
in that proved more of a headache than it was worth so I forked it to
work just with `javascript`.

Thus this page allows the user to enter `javascript` code which is
then evaluated and the results displayed.  The display page contains a
`canvas` element and there are various extensions provided to give some easy access to drawing on this `canvas`.

## Usage

This branch contains the code needed when exporting a project.
The **Export** button on the code editor provides a `javascript` file
for downloading called `project.js`.  To create a website for that
project, download this branch of the `jsCanvas` project and place the
`project.js` file in the `js` directory.  Then upload the files to a
suitable place.

## Dependencies

An exported project uses the following `javascript` libraries:

3. [jQuery](https://jquery.com/) to make life a little easier inside the code.
4. [jQuery-ui](https://jqueryui.com/) to make life a little easier outside the code.

(These are all installed with the project to make it self-contained.)

## Acknowledgements

This project was *heavily* influenced by the awesome [Codea](http://twolivesleft.com/Codea/).  The only down side to Codea is that it only runs on iPads, thus failing criterion 3.  If you find this project fun but limited, and have an iPad, you should *definitely* get hold of Codea (or Codea Scratchpad).
