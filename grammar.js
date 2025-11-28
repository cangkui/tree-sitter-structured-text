const unsignedInteger = seq(
  /\d/,
  repeat(choice('_', /\d/))
);

const signedInteger = seq(
  optional(/[\+-]/), 
  unsignedInteger
);

module.exports = grammar({
  name: 'structured_text',
  
  extras: $ => [
    $.inline_comment,
    $.block_comment,
    /\s/
  ],
  
  word: $ => $.identifier,
  
  conflicts: $ => [
    [$.case],
    [$.variable],
    [$.variable, $.call_expression]
  ],
  
  supertypes: $ => [
    $._definition,
    $.statement,
    $._control_statement,
    $._loop_statement,
    $._expression,
    $._literal
  ],
  
  rules: {
    // source_file: $ => repeat(choice(
    //   $._definition, 
    //   $._declaration
    // )),
    source_file: $ => repeat($._definition),
    
    _definition: $ => choice(
      $.program_definition,
      $.action_definition,
      $.fc_definition,
      $.fb_definition,
      $.type_definition
    ),
    
    /*_declaration: $ => choice(
      $.constant_declaration,
      // variable declaration
    ),*/
    
    program_definition: $ => seq(
      /PROGRAM/i,
      field('name', $.identifier),
      repeat($.statement),
      /END_PROGRAM/i
    ),
    
    action_definition: $ => seq(
      /ACTION/i,
      field('name', $.identifier),
      ':',
      repeat($.statement),
      /END_ACTION/i
    ),
    
    // constant_declaration: $ => seq(
    //   /VAR/i, /CONSTANT/i,
    //   repeat($.constant),
    //   /END_VAR/i
    // ),

    fc_definition: $ => seq(
      /FUNCTION/i,
      field('name', $.identifier),
      ':',
      $._data_type,
      repeat($.fc_var_blocks),
      field('body', repeat($.statement)),
      /END_FUNCTION/i,
      optional(';')
    ),

    fb_definition: $ => seq(
      /FUNCTION_BLOCK/i,
      field('name', $.identifier),
      repeat($.fc_var_blocks),
      field('body', repeat($.statement)),
      /END_FUNCTION_BLOCK/i,
      optional(';')
    ),

    type_definition: $ => seq(
      // TYPE ... END_TYPE
      /TYPE/i,
      field('name', $.identifier),
      ':',
      field('body', $.type_declaration),
      /END_TYPE/i
    ),

    fc_var_blocks: $ => choice(
      $.var_block,
      $.var_tmp_block,
      $.var_input_block,
      $.var_in_out_block,
      $.var_output_block,
      $.var_local_block,
      // $.constant_declaration,
    ),

    _var_modifier: $ => choice(
      'CONSTANT',
      'RETAIN',
      // 'PERSISTENT',
      // can add more if needed
    ),

    var_input_block: $ => seq(
      /VAR_INPUT/i,
      repeat($._var_modifier),
      repeat($.variable_declaration),
      /END_VAR/i
    ),

    var_block: $ => seq(
      /VAR/i,
      repeat($._var_modifier),
      repeat($.variable_declaration),
      /END_VAR/i
    ),

    var_local_block: $ => seq(
      /VAR_LOCAL/i,
      repeat($.variable_declaration),
      /END_VAR/i
    ),

    var_in_out_block: $ => seq(
      /VAR_IN_OUT/i,
      repeat($.variable_declaration),
      /END_VAR/i
    ),

    var_output_block: $ => seq(
      /VAR_OUTPUT/i,
      repeat($._var_modifier),
      repeat($.variable_declaration),
      /END_VAR/i
    ),

    var_tmp_block: $ => seq(
      /VAR_TEMP/i,
      repeat($.variable_declaration),
      /END_VAR/i
    ),
    
    /* 
      Statements
    */
    
    statement: $ => choice(
      $.assignment,
      // $.expression_statement,
      $.call_statement,
      $._control_statement,
      $._loop_statement,
      $.return_statement,
      $.exit_statement
    ),
    
    _control_statement: $ => choice(
      $.case_statement,
      $.if_statement
    ),
    
    _loop_statement: $ => choice(
      $.for_statement,
      $.repeat_statement,
      $.while_statement
    ),
    
    assignment: $ => seq(
      $.variable,
      ':=',
      $._expression,
      ';'
    ),
    
    expression_statement: $ => seq($.variable, ';'),
    
    call_statement: $ => seq($.call_expression, ';'),
    
    if_statement: $ => seq(
      'IF',
      field('condition', $._expression),
      'THEN',
      repeat($.statement),
      repeat($.elseif_clause),
      optional($.else_clause),
      'END_IF',
      optional(';')
    ),
    
    case_statement: $ => seq(
      'CASE',
      field('value', $.variable),
      'OF',
      repeat($.case),
      optional($.else_case),
      'END_CASE',
      optional(';')
    ),
    
    for_statement: $ => seq(
      'FOR',
      $.for_range,
      'DO',
      repeat($.statement),
      'END_FOR',
      optional(';')
    ),
    
    repeat_statement: $ => seq(
      'REPEAT',
      repeat($.statement),
      'UNTIL',
      field('terminationCondition', $._expression),
      'END_REPEAT',
      optional(';')
    ),
    
    while_statement: $ => seq(
      'WHILE',
      $._expression,
      'DO',
      repeat($.statement),
      'END_WHILE',
      optional(';')
    ),
    
    /*
      Statement components
    */
    
    elseif_clause: $ => seq(
      'ELSIF',
      field('condition', $._expression),
      'THEN',
      repeat($.statement)
    ),
    
    else_clause: $ => seq(
      'ELSE',
      repeat($.statement)
    ),
    
    case: $ => seq(
      $.case_value,
      ':',
      repeat($.statement)
    ),
    
    else_case: $ => seq(
      'ELSE',
      repeat($.statement)
    ),
    
    case_value: $ => commaSep1(choice(
      alias(token(signedInteger), $.integer),
      $.index_range,
      $.identifier
    )),
    
    index_range: $ => seq(
      field('lower', choice(alias(token(signedInteger), $.integer), $.identifier)),
      '..',
      field('upper', choice(alias(token(signedInteger), $.integer), $.identifier))
    ),
    
    for_range: $ => seq(
      $.statement_initialization,
      'TO',
      $._expression,
      optional(seq('BY', $._expression))
    ),
    
    statement_initialization: $ => seq(
      $.variable, 
      ':=', 
      $._expression
    ),

    return_statement: $ => seq(
      'RETURN',
      optional($._expression),
      ';'
    ),

    exit_statement: $ => 'EXIT;',
    
    /*
      Declarations
    */
    
    // constant: $ => seq(
    //   field('name', $.identifier),
    //   ':',
    //   $._data_type, 
    //   $.variable_initialization
    // ),

    // variable_declaration: $ => seq(
    //   field('name', $.identifier),
    //   ':',
    //   field('type', $._data_type),
    //   optional(choice(
    //     $.variable_initialization, ';'
    //   ))
    // ),

    variable_declaration: $ => seq(
      field('vars', $.var_list),        // more than one var like x,y,z
      ':',
      field('type', $._data_type),
      repeat($.var_specs),            // AT address := init value or CONSTANT, etc. 0-1
      ';'
    ),

    var_list: $ => seq(
      $.identifier,
      repeat(seq(',', $.identifier))
    ),

    var_specs: $ => choice(
      $.location,             // AT %MW100
      $._var_modifier,        // modifiers like CONSTANT/RETAIN/PERSISTENT
      $.variable_initialization
    ),

    location: $ => seq('AT', $.address),

    address: $ => choice(
      seq('%', field('location', $.direct_address)),
      field('symbol', $.identifier)          // mapping the symbol like %Motor1
    ),

    direct_address: $ => seq(
      field('prefix', $.location_prefix),
      field('size',   $.size_prefix),
      field('number', $.address_number),
      optional(seq('.', field('bit', alias($.digit, $.number))))  // .0 => .15
    ),

    location_prefix: $ => choice('I', 'Q', 'M'),   // Input / Output / Memory
    size_prefix:     $ => choice('X', 'B', 'W', 'D', 'L'), // Bit/Byte/Word/DWord/LWord
    address_number:  $ => $.integer,
    digit:           $ => /[0-9]/,                 // Single digit, used for bit indexing
    
    struct_declaration: $ => seq(
      /STRUCT/i,
      repeat(field('member', $.variable_declaration)),
      /END_STRUCT/i
    ),

    type_declaration: $ => choice(
      $.struct_declaration,
      // ... add more type declarations if needed
    ),

    /*
      Declaration components
    */
    variable_initialization: $ => seq(
      ':=',
      choice(
        commaSep1(choice($._expression, $.repetition_expression)),
        seq('[', commaSep1(choice($._expression, $.repetition_expression)), ']')
      ),
      ';'
    ),
    
    /*
      Expressions
    */
    
    _expression: $ => choice(
      $._literal,
      $.variable,
      $.parenthesis_expression,
      $.unary_expression,
      $.binary_expression,
      $.mask_expression,
      $.call_expression
    ),
    
    parenthesis_expression: $ => seq('(', $._expression, ')'),
    
    unary_expression: $ => prec(6, choice(
      seq('NOT', $._expression),
      seq('+', $._expression),
      seq('-', $._expression)
    )),
    
    binary_expression: $ => choice(
      prec.left(5, seq($._expression, '**', $._expression)), // Not supported in Automation Studio
      prec.left(4, seq($._expression, '*', $._expression)),
      prec.left(4, seq($._expression, '/', $._expression)),
      prec.left(4, seq($._expression, 'MOD', $._expression)),
      prec.left(3, seq($._expression, '+', $._expression)),
      prec.left(3, seq($._expression, '-', $._expression)),
      prec.left(2, seq($._expression, '<', $._expression)),
      prec.left(2, seq($._expression, '>', $._expression)),
      prec.left(2, seq($._expression, '<=', $._expression)),
      prec.left(2, seq($._expression, '>=', $._expression)),
      prec.left(1, seq($._expression, '=', $._expression)),
      prec.left(1, seq($._expression, '<>', $._expression)),
      prec.left(0, seq($._expression, 'AND', $._expression)),
      prec.left(0, seq($._expression, 'XOR', $._expression)),
      prec.left(0, seq($._expression, 'OR', $._expression))
    ),
    
    parameter_assignment: $ => seq(
      alias($.identifier, $.parameter),
      ':=',
      $._expression
    ),
    
    call_expression: $ => seq(
      field('name', $.identifier),
      optional($.index), // Only for function block instances
      '(',
      commaSep(field('input', choice($.parameter_assignment, $._expression))), // Function calls have ordered lists allowing expressions
      ')'
    ),
    
    mask_expression: $ => seq(
      $.variable, 
      token.immediate('.'), 
      /\d{1,2}/
    ),
    
    repetition_expression: $ => seq(
      $._expression,
      '(', $._expression, ')'
    ),
    
    /*
      Variables
    */
    
    variable: $ => seq(
      field('name', $.identifier),
      optional($.index),
      optional($.structure_member)
    ),
    
    index: $ => seq(
      '[',
      field('dim1', $._expression),
      optional(seq(',', field('dim2', $._expression))),
      ']'
    ),
    
    structure_member: $ => seq(token.immediate('.'), choice($.variable, $.call_expression)),
    
    /*
      Data types
    */
    _data_type: $ => choice(
      $.sized_type,
      alias($.identifier, $.derived_data_type),
      $.array_type
    ),

    // Basic types of possible band lengths
    sized_type: $ => choice(
      ...['BOOL','TIME','DATE','TOD','DT','BYTE'].map(k => k), // no length
      seq(/U?[SD]?INT/, optional($.type_length)),   // INT(8) / UINT(16) …
      seq(/L?REAL/,    optional($.type_length)),   // REAL(32) / LREAL(64) …
      seq(/W?STRING/,  optional($.type_length))    // STRING(80) / WSTRING(100)…
    ),

    // Length child node: (integer)
    type_length: $ => seq('(', alias($.integer, $.length), ')'),
    
    basic_data_type: $ => choice(
      'BOOL',
      /U?[SD]?INT/,
      /L?REAL/,
      'TIME',
      'DATE',
      'TIME_OF_DAY',
      'TOD',
      'DATE_AND_TIME',
      'DT',
      /W?STRING/,
      'BYTE',
      /D?WORD/
    ),
    
    array_type: $ => seq(
      'ARRAY',
      '[',
      commaSep1($.index_range),
      ']',
      'OF',
      choice($.basic_data_type, alias($.identifier, $.derived_data_type))
    ),
    
    /*
      Literals
    */
    
    _literal: $ => choice(
      $.boolean,
      $.integer,
      $.floating_point,
      $.binary,
      $.octal,
      $.hexidecimal,
      $.time,
      $.date,
      $.time_of_day,
      $.date_and_time,
      $.string,
      $.wstring
    ),
    
    boolean: $ => token(choice('TRUE', 'FALSE')),
    
    integer: $ => {
      return token(unsignedInteger);
    },
    
    floating_point: $ => {
      const scientific = seq(/[eE]/, signedInteger);
      return token(seq(
        unsignedInteger,
        choice(
          seq(
            '.',
            repeat(choice('_', /\d/)),
            optional(scientific)
          ),
          scientific
        )
      ));
    },
    
    binary: $ => token(seq('2#', /_*[0-1]/, repeat(choice('_', /[0-1]/)))),
    
    octal: $ => token(seq('8#', /_*[0-7]/, repeat(choice('_', /[0-7]/)))),
    
    hexidecimal: $ => token(seq('16#', /_*[0-9a-fA-F]/, repeat(choice('_', /[0-9a-fA-F]/)))),
    
    time: $ => token(seq(
      'T#',
      optional('-'),
      optional(/\d{1,2}[dD]/),
      optional(/\d{1,3}[hH]/),
      optional(/\d{1,5}[mM]/),
      optional(/\d{1,9}[sS]/),
      optional(/\d{1,9}((ms)|(MS))/)
    )),
    
    date: $ => token(seq(
      'D#',
      /\d(_?\d){3}/, // Year
      /(-\d(_?\d)?){2}/ // Month and day
    )),
    
    time_of_day: $ => token(seq(
      'TOD#',
      /\d(_?\d)?/,
      ':',
      /\d(_?\d)?/,
      optional(seq(
        ':',
        /\d(_?\d)?/,
        optional(seq('.', /\d(_?\d)*/))
      ))
    )),
    
    date_and_time: $ => seq(
      'DT#',
      /\d(_?\d){3}/, // Year
      /(-\d(_?\d)?){3}/, // Month, day, hour
      /(:\d(_?\d)?){1,2}/ // Minute, second
    ),
    
    string: $ => token(prec.left(seq(
      '\'',
      /.*/,
      '\''
    ))),
    
    wstring: $ => token(prec.left(seq(
      '"',
      /.*/,
      '"'
    ))),
    
    inline_comment: $ => token(seq('//', /.*/)),
    
    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    block_comment: $ => token(seq(
      '(*',
      /[^*]*\*+([^*)][^*]*\*+)*/,
      ')'
    )),
    
    identifier: $ => /[a-zA-Z_]\w*/,
    
  }
  
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
