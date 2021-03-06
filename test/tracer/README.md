# Goal

Create a trace file when starting the emu.

Useful to compare it with a MAME trace.

# Motivation

I could not find a test ROM that validated the CPU for a WPC machine. So the approach
is to dump a MAME ROM and compare that with a dump of wpc-emu to find any issues.

## Env variables
- `ROMFILE`: define rom file
- `HAS_SECURITY_FEATURE` if set to true, security pic will be emulated
- `STEPS`: numbers of steps to run

## Create WPC-Emu dump file

Tracer write trace output to stderr.

Example:

```
env ROMFILE=../../rom/john1_2r.rom HAS_SECURITY_FEATURE=true STEPS=4000000 node index.js 2> OUTPUTDIR/john1_2r_wpc.dump
```

Also see `./_runbig.sh` script to autogenerate the dump files.

## Create MAME CPU trace file

I use SDLMAME (http://sdlmame.lngn.net/) v0.202.

Reference: https://www.dorkbotpdx.org/blog/skinny/use_mames_debugger_to_reverse_engineer_and_extend_old_games

Copy rom files to `roms` directory.

- start mame with `./mame64 -window -c -debug hurr_l2` (starting hurricane wpc)
- we want to dump all registers, so enter `trace hc_mame.dump,0,,{tracelog "CC=%02X A=%04X B=%04X X=%04X Y=%04X S=%04X U=%04X ",cc, a, b, x, y, s, u}`
- run game (F5)
- enter `traceflush` to flush trace file
- enter `trace off` to disable trace

## Diff files

Run `git diff --no-index mame.dump wpcemu.dump`

## How to read

```
CC=50 A=0000 B=0000 X=0000 Y=0000 S=0000 U=0000 8C65: LDA   #$00
CC=54 A=0000 B=0000 X=0000 Y=0000 S=0000 U=0000 8C67: STA   $3FF2
```

- registers are current state
- PC points to next instruction
- OP Codes show NEXT INSTRUCTION

# Statistics

## MAME vs. WPC-EMU 0.7.4, Hurricane (WPC-89)

- `HURCNL_2_wpc.dump`:  74'852'074 bytes
- `HURCNL_2_mame.dump`: 78'840'913 bytes

```
cat HURCNL_2_wpc.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
  110 $3FF2
 1890 $3FF4
 1773 $3FF6
    1 $3FF8
    6 $3FFA
   56 $3FFB
11098 $3FFC
 1221 $3FFD
    2 $3FFE
13925 $3FFF

cat HURCNL_2_mame.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
  117 $3FF2
 2002 $3FF4
 1885 $3FF6
    3 $3FF8
    6 $3FFA
   59 $3FFB
11587 $3FFC
 1223 $3FFD
    2 $3FFE
14795 $3FFF
```

Conclusion:
- WPC-Emu and MAME calls a pretty similar

## MAME vs. WPC-EMU 0.7.4, Twilight Zone (WPC Fliptronic)

- `tz_wpc.dump`:  85'205'983 bytes
- `tz_mame.dump`: 81'789'061 bytes

```
cat tz_wpc.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
   90 $3FF2
 1476 $3FF4
 1382 $3FF6
   72 $3FF8  # WPC_PERIPHERAL_TIMER_FIRQ_CLEAR   << 2 times more
    6 $3FFA
   44 $3FFB
11350 $3FFC
 1671 $3FFD
    2 $3FFE
11764 $3FFF

cat tz_mame.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
   87 $3FF2
 1428 $3FF4
 1334 $3FF6
   37 $3FF8
    6 $3FFA
   43 $3FFB
11080 $3FFC
 1673 $3FFD
    2 $3FFE
11378 $3FFF
```

Conclusion:
- WPC-Emu and MAME calls a pretty similar, only exception is the WPC_PERIPHERAL_TIMER_FIRQ_CLEAR call


## MAME vs. WPC-EMU 0.7.4, Indiana Jones (WPC DCS)

- `ij_wpc.dump`:  88'318'434 bytes
- `ij_mame.dump`: 92'663'822 bytes

```
cat ij_wpc.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
   89 $3FF2
 1448 $3FF4  # WPC_SHIFTADDR   << 8 times less
 1354 $3FF6  # WPC_SHIFTBIT   << 8 times less
    4 $3FF8  # WPC_PERIPHERAL_TIMER_FIRQ_CLEAR   << 2021 times less
    6 $3FFA
   43 $3FFB
12712 $3FFC
 1845 $3FFD
    2 $3FFE
11901 $3FFF  # WPC_ZEROCROSS_IRQ_CLEAR   << 2 times more

cat ij_mame.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
   65 $3FF2
11512 $3FF4
11490 $3FF6
 2021 $3FF8
    6 $3FFA
   36 $3FFB
14543 $3FFC
 1074 $3FFD
    2 $3FFE
 8799 $3FFF
```

Conclusion:
- WPC-Emu and MAME implementation differs


## MAME vs. WPC-EMU 0.7.4, Johnny Mnemonic (WPC-S)

- `john1_2r_wpc.dump`:   96'081'089 bytes
- `john1_2r_mame.dump`: 101'099'192 bytes

```
# cat john1_2r_wpc.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
   91 $3FF2
 5870 $3FF3
 1402 $3FF4  # WPC_SHIFTADDR  << 2 times less
 1318 $3FF6  # WPC_SHIFTBIT
  107 $3FF8  # WPC_PERIPHERAL_TIMER_FIRQ_CLEAR  << 10 times less
    6 $3FFA
   42 $3FFB
18532 $3FFC
 1925 $3FFD  # WPC_RAM_LOCK  << 2 rimes more
    2 $3FFE
11975 $3FFF

# cat john1_2r_mame.dump | grep "\$3FF" | awk '{print $10}' | sort | uniq -c
   78 $3FF2
 5965 $3FF3
 3338 $3FF4
 3248 $3FF6
 1175 $3FF8
   12 $3FFA
   39 $3FFB
21272 $3FFC
 3291 $3FFD
    4 $3FFE
10478 $3FFF
```

Conclusion:
- Major diffs, focus on $3FF3 and $3FF8
