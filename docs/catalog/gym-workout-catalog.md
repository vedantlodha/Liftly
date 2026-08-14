---
title: Common Gym Workout Catalog
version: 1.1
last_updated: 2026-08-12
unit_system: metric
exercise_count: 157
parameter_notation: "parameter:type[unit]{allowed values}; ? means optional"
---

# Common Gym Workout Catalog

This catalog covers common strength, bodyweight, functional, mobility, and cardio exercises found in commercial gyms. The **Parameters** column defines the data that can be recorded for one exercise entry.

## Parameter conventions

| Parameter | Type / unit | Meaning |
|---|---|---|
| `sets` | integer | Number of rounds or sets |
| `reps` | integer | Repetitions completed per set |
| `rep_unit` | enum | What one repetition counts as: `jumps` or `seconds`. Only needed where both readings are common |
| `weight_kg` | decimal, kg | External weight used; record total loaded weight unless an app specifies “per hand” |
| `assistance_kg` | decimal, kg | Assistance supplied by a machine or band |
| `duration_sec` | integer, seconds | Work or hold time |
| `duration_min` | decimal, minutes | Total cardio duration |
| `distance_m` | decimal, metres | Short distance, often for carries, sleds, or rowing |
| `distance_km` | decimal, kilometres | Longer cardio distance |
| `speed_kph` | decimal, km/h | Machine or average speed |
| `pace_min_per_km` | duration, min/km | Running, walking, rowing, or skiing pace |
| `incline_pct` | decimal, percent | Treadmill incline or ramp grade |
| `resistance_level` | integer | Machine resistance setting |
| `cadence_rpm` | integer, rpm | Pedalling or stepping cadence |
| `stroke_rate_spm` | integer, strokes/min | Rowing or ski-erg stroke rate |
| `floors` | integer | Floors climbed on a stair machine |
| `steps` | integer | Steps completed |
| `rounds` | integer | Completed circuit or interval rounds |
| `work_sec` | integer, seconds | Work portion of an interval |
| `rest_sec` | integer, seconds | Rest between sets or intervals |
| `calories_kcal` | decimal, kcal | Machine-estimated energy expenditure |
| `heart_rate_bpm` | integer, bpm | Average or target heart rate |
| `rpe` | decimal, 1–10 | Rating of perceived exertion |
| `side` | enum | `left`, `right`, or `both` for unilateral work |
| `band_level` | text | Band colour, tension, or light/medium/heavy label |
| `box_height_cm` | decimal, cm | Box or platform height |
| `ball_weight_kg` | decimal, kg | Medicine/slam ball weight |
| `kettlebell_weight_kg` | decimal, kg | Kettlebell weight |

**Notation:** `?` means optional. A pipe inside braces means “choose one,” for example `rep_unit:{jumps|seconds}`. For unilateral dumbbell work, `weight_kg` should be the weight of one dumbbell and `side` can be recorded when sides are performed separately.

## Chest

| Workout | Equipment | Parameters |
|---|---|---|
| Barbell Bench Press | Barbell, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Incline Barbell Bench Press | Barbell, incline bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Decline Barbell Bench Press | Barbell, decline bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Dumbbell Bench Press | Dumbbells, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Incline Dumbbell Press | Dumbbells, incline bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Decline Dumbbell Press | Dumbbells, decline bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Dumbbell Fly | Dumbbells, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Cable Fly | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Low-to-High Cable Fly | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| High-to-Low Cable Fly | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Pec Deck Fly | Pec deck machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Machine Chest Press | Chest press machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Push-Up | Bodyweight | `sets:int, reps:int, rest_sec:int?, rpe:decimal?` |
| Weighted Push-Up | Plate or vest | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |

## Back

| Workout | Equipment | Parameters |
|---|---|---|
| Conventional Deadlift | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Sumo Deadlift | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Barbell Bent-Over Row | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Pendlay Row | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| One-Arm Dumbbell Row | Dumbbell, bench | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |
| Chest-Supported Dumbbell Row | Dumbbells, incline bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| T-Bar Row | T-bar or landmine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Seated Cable Row | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Machine Row | Row machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Lat Pulldown | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Close-Grip Lat Pulldown | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Straight-Arm Pulldown | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Pull-Up | Pull-up bar | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?, rpe:decimal?` |
| Chin-Up | Pull-up bar | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?, rpe:decimal?` |
| Assisted Pull-Up | Assisted machine | `sets:int, reps:int, assistance_kg:decimal, rest_sec:int?` |
| Back Extension | Roman chair or machine | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |

## Shoulders and Traps

| Workout | Equipment | Parameters |
|---|---|---|
| Standing Barbell Overhead Press | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Seated Barbell Shoulder Press | Barbell, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Seated Dumbbell Shoulder Press | Dumbbells, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Arnold Press | Dumbbells, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Machine Shoulder Press | Shoulder press machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Dumbbell Lateral Raise | Dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Cable Lateral Raise | Cable machine | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |
| Dumbbell Front Raise | Dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Reverse Dumbbell Fly | Dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Reverse Pec Deck | Pec deck machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Face Pull | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Barbell Upright Row | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Barbell Shrug | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Dumbbell Shrug | Dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |

## Biceps, Triceps, and Forearms

| Workout | Equipment | Parameters |
|---|---|---|
| Barbell Curl | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| EZ-Bar Curl | EZ bar | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Dumbbell Curl | Dumbbells | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |
| Alternating Dumbbell Curl | Dumbbells | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |
| Hammer Curl | Dumbbells | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |
| Incline Dumbbell Curl | Dumbbells, incline bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Preacher Curl | Preacher bench, bar or machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Cable Curl | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Close-Grip Bench Press | Barbell, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Triceps Pushdown | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Rope Triceps Pushdown | Cable machine, rope | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Overhead Cable Triceps Extension | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Dumbbell Overhead Triceps Extension | Dumbbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Skull Crusher | EZ bar or dumbbells, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Triceps Dip | Dip bars | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |
| Assisted Dip | Assisted machine | `sets:int, reps:int, assistance_kg:decimal, rest_sec:int?` |
| Triceps Kickback | Dumbbell or cable | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |
| Wrist Curl | Barbell or dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Reverse Wrist Curl | Barbell or dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Reverse Curl | EZ bar or barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Farmer’s Carry | Dumbbells or trap bar | `sets:int, weight_kg:decimal, distance_m:decimal?, duration_sec:int?, rest_sec:int?` |
| Dead Hang | Pull-up bar | `sets:int, duration_sec:int, weight_kg:decimal?, rest_sec:int?` |

## Legs and Glutes

| Workout | Equipment | Parameters |
|---|---|---|
| Back Squat | Barbell, rack | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Front Squat | Barbell, rack | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Goblet Squat | Dumbbell or kettlebell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Hack Squat | Hack squat machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Smith Machine Squat | Smith machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Leg Press | Leg press machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Leg Extension | Leg extension machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Romanian Deadlift | Barbell or dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Stiff-Leg Deadlift | Barbell or dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Lying Leg Curl | Leg curl machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Seated Leg Curl | Leg curl machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Nordic Hamstring Curl | Bench or partner | `sets:int, reps:int, assistance_kg:decimal?, rest_sec:int?` |
| Barbell Hip Thrust | Barbell, bench | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Glute Bridge | Bodyweight or barbell | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |
| Cable Pull-Through | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Walking Lunge | Dumbbells or bodyweight | `sets:int, reps:int, weight_kg:decimal?, side:enum?, distance_m:decimal?, rest_sec:int?` |
| Reverse Lunge | Dumbbells or bodyweight | `sets:int, reps:int, weight_kg:decimal?, side:enum?, rest_sec:int?` |
| Bulgarian Split Squat | Dumbbells, bench | `sets:int, reps:int, weight_kg:decimal?, side:enum?, rest_sec:int?` |
| Step-Up | Dumbbells, box | `sets:int, reps:int, weight_kg:decimal?, box_height_cm:decimal?, side:enum?, rest_sec:int?` |
| Cable Glute Kickback | Cable machine | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |
| Hip Abduction | Abduction machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Hip Adduction | Adduction machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Standing Calf Raise | Machine or dumbbells | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |
| Seated Calf Raise | Calf machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Donkey Calf Raise | Machine or bodyweight | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |
| Single-Leg Calf Raise | Bodyweight or dumbbell | `sets:int, reps:int, weight_kg:decimal?, side:enum?, rest_sec:int?` |

## Core

| Workout | Equipment | Parameters |
|---|---|---|
| Crunch | Mat | `sets:int, reps:int, rest_sec:int?` |
| Sit-Up | Mat | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |
| Cable Crunch | Cable machine | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?` |
| Decline Sit-Up | Decline bench | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |
| Hanging Knee Raise | Pull-up station | `sets:int, reps:int, rest_sec:int?` |
| Hanging Leg Raise | Pull-up station | `sets:int, reps:int, rest_sec:int?` |
| Captain’s Chair Knee Raise | Captain’s chair | `sets:int, reps:int, rest_sec:int?` |
| Reverse Crunch | Mat or bench | `sets:int, reps:int, rest_sec:int?` |
| Ab Wheel Rollout | Ab wheel | `sets:int, reps:int, rest_sec:int?` |
| Russian Twist | Medicine ball or plate | `sets:int, reps:int, weight_kg:decimal?, rest_sec:int?` |
| Bicycle Crunch | Mat | `sets:int, reps:int, rest_sec:int?` |
| Mountain Climber | Bodyweight | `sets:int, reps:int?, duration_sec:int?, rest_sec:int?` |
| Plank | Mat | `sets:int, duration_sec:int, weight_kg:decimal?, rest_sec:int?` |
| Side Plank | Mat | `sets:int, duration_sec:int, side:enum?, weight_kg:decimal?, rest_sec:int?` |
| Pallof Press | Cable or resistance band | `sets:int, reps:int, weight_kg:decimal?, band_level:text?, side:enum?, rest_sec:int?` |
| Wood Chop | Cable machine | `sets:int, reps:int, weight_kg:decimal, side:enum?, rest_sec:int?` |

## Full-Body, Functional, and Plyometric

| Workout | Equipment | Parameters |
|---|---|---|
| Burpee | Bodyweight | `sets:int, reps:int?, duration_sec:int?, rest_sec:int?, rpe:decimal?` |
| Jumping Jack | Bodyweight | `sets:int, reps:int?, duration_sec:int?, rest_sec:int?` |
| Bodyweight Squat | Bodyweight | `sets:int, reps:int, rest_sec:int?` |
| Squat Jump | Bodyweight | `sets:int, reps:int, rest_sec:int?` |
| Box Jump | Plyometric box | `sets:int, reps:int, box_height_cm:decimal?, rest_sec:int?` |
| Kettlebell Swing | Kettlebell | `sets:int, reps:int, kettlebell_weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Kettlebell Clean | Kettlebell | `sets:int, reps:int, kettlebell_weight_kg:decimal, side:enum?, rest_sec:int?` |
| Kettlebell Snatch | Kettlebell | `sets:int, reps:int, kettlebell_weight_kg:decimal, side:enum?, rest_sec:int?` |
| Kettlebell Turkish Get-Up | Kettlebell | `sets:int, reps:int, kettlebell_weight_kg:decimal, side:enum?, rest_sec:int?` |
| Barbell Clean | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Barbell Snatch | Barbell | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Thruster | Barbell or dumbbells | `sets:int, reps:int, weight_kg:decimal, rest_sec:int?, rpe:decimal?` |
| Medicine-Ball Slam | Medicine ball | `sets:int, reps:int, ball_weight_kg:decimal, rest_sec:int?` |
| Medicine-Ball Wall Throw | Medicine ball, wall | `sets:int, reps:int, ball_weight_kg:decimal, rest_sec:int?` |
| Battle Ropes | Battle ropes | `sets:int, duration_sec:int, rest_sec:int?, rpe:decimal?` |
| Sled Push | Weighted sled | `sets:int, weight_kg:decimal, distance_m:decimal, duration_sec:int?, rest_sec:int?, rpe:decimal?` |
| Sled Pull | Weighted sled | `sets:int, weight_kg:decimal, distance_m:decimal, duration_sec:int?, rest_sec:int?, rpe:decimal?` |
| Sandbag Carry | Sandbag | `sets:int, weight_kg:decimal, distance_m:decimal?, duration_sec:int?, rest_sec:int?` |
| Bear Crawl | Bodyweight | `sets:int, distance_m:decimal?, duration_sec:int?, rest_sec:int?` |

## Cardio

| Workout | Equipment | Parameters |
|---|---|---|
| Treadmill Walk | Treadmill | `duration_min:decimal, distance_km:decimal?, speed_kph:decimal?, incline_pct:decimal?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Treadmill Run | Treadmill | `duration_min:decimal, distance_km:decimal?, speed_kph:decimal?, pace_min_per_km:duration?, incline_pct:decimal?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Outdoor Walk | None | `duration_min:decimal, distance_km:decimal?, speed_kph:decimal?, pace_min_per_km:duration?, steps:int?, heart_rate_bpm:int?, rpe:decimal?` |
| Outdoor Run | None | `duration_min:decimal, distance_km:decimal?, speed_kph:decimal?, pace_min_per_km:duration?, heart_rate_bpm:int?, rpe:decimal?` |
| Stationary Bike | Exercise bike | `duration_min:decimal, distance_km:decimal?, resistance_level:int?, speed_kph:decimal?, cadence_rpm:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Spin Bike | Spin bike | `duration_min:decimal, distance_km:decimal?, resistance_level:int?, cadence_rpm:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Recumbent Bike | Recumbent bike | `duration_min:decimal, distance_km:decimal?, resistance_level:int?, speed_kph:decimal?, cadence_rpm:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Outdoor Cycling | Bicycle | `duration_min:decimal, distance_km:decimal?, speed_kph:decimal?, cadence_rpm:int?, heart_rate_bpm:int?, rpe:decimal?` |
| Elliptical Trainer | Elliptical | `duration_min:decimal, distance_km:decimal?, resistance_level:int?, incline_pct:decimal?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Stair Climber | Stair machine | `duration_min:decimal, floors:int?, steps:int?, speed_kph:decimal?, resistance_level:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Rowing Machine | Rowing ergometer | `duration_min:decimal, distance_m:decimal?, pace_min_per_km:duration?, stroke_rate_spm:int?, resistance_level:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Ski Erg | Ski ergometer | `duration_min:decimal, distance_m:decimal?, pace_min_per_km:duration?, stroke_rate_spm:int?, resistance_level:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Skipping / Jump Rope | Jump rope | `sets:int, reps:decimal, rep_unit:{jumps\|seconds}, rest_sec:int?, rpe:decimal?` |
| Swimming | Pool | `duration_min:decimal, distance_m:decimal?, pace_min_per_km:duration?, heart_rate_bpm:int?, rpe:decimal?` |
| Pool Running | Pool | `duration_min:decimal, distance_m:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Arm Ergometer | Arm bike | `duration_min:decimal, distance_km:decimal?, resistance_level:int?, cadence_rpm:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Cardio Dance / Zumba | Open floor | `duration_min:decimal, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Aerobics / Step Class | Step platform | `duration_min:decimal, steps:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| Steady-State Cardio Circuit | Any cardio machines | `duration_min:decimal, rounds:int?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |
| HIIT Cardio Intervals | Any cardio machine | `rounds:int, work_sec:int, rest_sec:int, duration_min:decimal?, distance_km:decimal?, calories_kcal:decimal?, heart_rate_bpm:int?, rpe:decimal?` |

## Mobility and Warm-Up

| Workout | Equipment | Parameters |
|---|---|---|
| Foam Rolling | Foam roller | `sets:int?, duration_sec:int, side:enum?` |
| Dynamic Leg Swing | Support bar | `sets:int, reps:int, side:enum?` |
| Arm Circle | None | `sets:int, reps:int?, duration_sec:int?` |
| Band Pull-Apart | Resistance band | `sets:int, reps:int, band_level:text?` |
| Shoulder Dislocation / Pass-Through | Band or dowel | `sets:int, reps:int, band_level:text?` |
| Hip Flexor Stretch | Mat | `sets:int, duration_sec:int, side:enum?` |
| Hamstring Stretch | Mat or bench | `sets:int, duration_sec:int, side:enum?` |
| Calf Stretch | Wall or wedge | `sets:int, duration_sec:int, side:enum?` |
| Thoracic Rotation | Mat | `sets:int, reps:int, side:enum?` |
| Cat–Cow | Mat | `sets:int, reps:int?, duration_sec:int?` |

## Example records

```yaml
- workout: Dumbbell Curl
  sets: 3
  reps: 12
  weight_kg: 10
  side: both
  rest_sec: 60

- workout: Skipping / Jump Rope
  sets: 5
  reps: 60
  rep_unit: seconds
  rest_sec: 30

- workout: Skipping / Jump Rope
  sets: 3
  reps: 100
  rep_unit: jumps
  rest_sec: 45

- workout: Stationary Bike
  duration_min: 30
  resistance_level: 7
  distance_km: 12.4
  heart_rate_bpm: 142

- workout: Plank
  sets: 3
  duration_sec: 45
  rest_sec: 30
```

## Implementation notes

- Treat optional parameters as nullable fields.
- Store canonical measurements in metric units; convert only for display if imperial units are needed.
- For an exercise performed by time instead of repetitions, use `duration_sec`. Skipping deliberately uses `reps` plus `rep_unit` so a repetition can mean either elapsed seconds or completed jumps.
- For plate-loaded machines, choose one consistent rule: record either the total plates loaded or the machine’s displayed load.
- Machine resistance levels are not comparable across different machine brands or models.
- `rpe` uses a 1–10 scale, where 10 represents maximal effort.
